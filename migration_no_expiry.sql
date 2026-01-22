-- Migration for Indefinite Leave Expiry (Make leave never expire)

-- 1. Update Existing Grants to be valid forever (e.g. year 9999)
-- This "resurrects" expired grants.
UPDATE public.leave_grants
SET expiry_date = '9999-12-31';

-- 2. Update Approval Logic to prioritize "Oldest Valid From"
-- Since expiry is now all the same (or far future), we must sort by valid_from (Grant Date).
CREATE OR REPLACE FUNCTION approve_leave_request(target_request_id uuid)
RETURNS void AS $$
DECLARE
  req_record record;
  grant_record record;
  days_needed numeric;
  days_available numeric;
  days_to_take numeric;
BEGIN
  -- 1. Fetch the request
  SELECT * INTO req_record FROM public.leave_requests WHERE id = target_request_id FOR UPDATE;
  
  IF req_record.status != 'pending' THEN
    RAISE EXCEPTION 'Request is not pending';
  END IF;

  days_needed := req_record.amount_days;

  -- Check global Remaining
  IF calculate_remaining_leave(req_record.user_id) < days_needed THEN
     RAISE EXCEPTION 'Insufficient leave balance';
  END IF;

  -- 2. Iterate through valid grants in FIFO order based on GRANT DATE (valid_from)
  -- Changed ORDER BY from expiry_date to valid_from
  FOR grant_record IN 
    SELECT * FROM public.leave_grants 
    WHERE user_id = req_record.user_id 
      AND expiry_date >= current_date -- Should be true for '9999-12-31'
      AND (days_granted - days_used) > 0
    ORDER BY valid_from ASC
    FOR UPDATE
  LOOP
    EXIT WHEN days_needed <= 0;

    days_available := grant_record.days_granted - grant_record.days_used;
    
    IF days_available >= days_needed THEN
      days_to_take := days_needed;
    ELSE
      days_to_take := days_available;
    END IF;

    -- Update Grant
    UPDATE public.leave_grants 
    SET days_used = days_used + days_to_take
    WHERE id = grant_record.id;

    -- Create Consumption Record
    INSERT INTO public.leave_consumptions (request_id, grant_id, days_consumed)
    VALUES (target_request_id, grant_record.id, days_to_take);

    days_needed := days_needed - days_to_take;
  END LOOP;

  -- 3. Finalize Request
  UPDATE public.leave_requests
  SET status = 'approved'
  WHERE id = target_request_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
