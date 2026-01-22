-- Migration to add support for Half-day and Hourly leave requests (Version 2)

-- 1. Update Precision for Existing Tables
-- WARNING: This alters column types. Ensure no data loss (numeric conversion is safe).
ALTER TABLE public.leave_grants 
  ALTER COLUMN days_granted TYPE numeric(5, 3),
  ALTER COLUMN days_used TYPE numeric(5, 3);

ALTER TABLE public.leave_consumptions 
  ALTER COLUMN days_consumed TYPE numeric(5, 3);

-- 2. Add amount_days to leave_requests
ALTER TABLE public.leave_requests 
  ADD COLUMN amount_days numeric(5, 3) NOT NULL DEFAULT 1.0;

-- 3. Replace Function: approve_leave_request
-- Logic updated to use amount_days instead of fixed 1.0
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

  -- Use the amount requested (default 1.0, or 0.5, 0.125 etc)
  days_needed := req_record.amount_days;

  -- Check global Remaining
  IF calculate_remaining_leave(req_record.user_id) < days_needed THEN
     RAISE EXCEPTION 'Insufficient leave balance';
  END IF;

  -- 2. Iterate through valid grants in FIFO order (Oldest Expiry First)
  FOR grant_record IN 
    SELECT * FROM public.leave_grants 
    WHERE user_id = req_record.user_id 
      AND expiry_date >= current_date
      AND (days_granted - days_used) > 0
    ORDER BY expiry_date ASC
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
