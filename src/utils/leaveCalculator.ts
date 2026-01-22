import { differenceInMonths, addMonths, isSameDay, startOfDay, isBefore, addYears, isAfter } from 'date-fns';

/**
 * 労働基準法に基づく有給付与日数の定義
 * 勤続年数(ヶ月) -> 付与日数
 */
const LEAVE_ENTITLEMENTS = [
    { months: 6, days: 10 },    // 0.5年
    { months: 18, days: 11 },   // 1.5年
    { months: 30, days: 12 },   // 2.5年
    { months: 42, days: 14 },   // 3.5年
    { months: 54, days: 16 },   // 4.5年
    { months: 66, days: 18 },   // 5.5年
    { months: 78, days: 20 },   // 6.5年
    // 以降、1年ごとに20日
];

interface GrantInfo {
    days: number;
    grantDate: Date;
    expiryDate: Date;
    yearsOfService: number; // 概算年数
}

/**
 * 入社日に基づき、「現在有効であるべき過去の付与データ」を全て算出する
 * (時効2年を迎えていないもの)
 */
export function getValidPastGrants(joinedAt: Date, checkDate: Date = new Date()): GrantInfo[] {
    const start = startOfDay(joinedAt);
    const target = startOfDay(checkDate);
    const results: GrantInfo[] = [];

    // 1. 定義リストをチェック
    for (const ent of LEAVE_ENTITLEMENTS) {
        const grantDate = addMonths(start, ent.months);
        const expiryDate = addYears(grantDate, 100); // 実質無期限 (100年後)

        // 「付与日が過去(今日含む)」であれば履歴として返す
        if (isBefore(grantDate, target) || isSameDay(grantDate, target)) {
            results.push({
                days: ent.days,
                grantDate,
                expiryDate,
                yearsOfService: ent.months / 12
            });
        }
    }

    // 2. 6.5年以降のループチェック
    let currentMonths = 78 + 12; // 7.5年から
    // 安全のため、極端に未来までは計算しない (例えば勤続50年分まで)
    const MAX_MONTHS = 12 * 50;

    while (currentMonths < MAX_MONTHS) {
        const grantDate = addMonths(start, currentMonths);
        const expiryDate = addYears(grantDate, 100); // 実質無期限

        // まだ付与日が来ていなければループ終了 (これ以降も全て未来なので)
        if (isAfter(grantDate, target)) {
            break;
        }

        // 期限切れかどうかにかかわらず追加
        results.push({
            days: 20,
            grantDate,
            expiryDate,
            yearsOfService: currentMonths / 12
        });

        currentMonths += 12;
    }

    return results;
}

/**
 * (旧) 当日判定のみの関数 - 互換性のため残すが、getValidPastGrantsを使うのが推奨
 */
export function calculateGrantDays(joinedAt: Date, checkDate: Date = new Date()): number {
    const pastGrants = getValidPastGrants(joinedAt, checkDate);
    // 今日の日付と一致するものがあれば返す
    const todayGrant = pastGrants.find(g => isSameDay(g.grantDate, checkDate));
    return todayGrant ? todayGrant.days : 0;
}
