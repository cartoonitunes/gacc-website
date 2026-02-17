import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPool } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const discordId = (session.user as any).discordId;
  const pool = getPool();

  try {
    // Get member
    const memberRes = await pool.query(
      'SELECT id, discord_id, discord_name, daily_streak, perfect_daily_months, twitter_handle, email, is_supporter, created_at FROM members_member WHERE discord_id = $1',
      [discordId]
    );

    if (memberRes.rows.length === 0) {
      return NextResponse.json({ error: 'Member not found. You may not be registered with the GACC bot.' }, { status: 404 });
    }

    const member = memberRes.rows[0];

    // Get GP balance
    const gpRes = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as balance FROM points_points WHERE member_id = $1',
      [member.id]
    );

    // Get recent activity (last 20)
    const activityRes = await pool.query(
      'SELECT amount, event_type, assigned_by, data, created_at FROM points_points WHERE member_id = $1 ORDER BY created_at DESC LIMIT 20',
      [member.id]
    );

    // Get redemptions
    const redemptionRes = await pool.query(
      "SELECT amount, data, created_at FROM points_points WHERE member_id = $1 AND event_type = 'redemption' ORDER BY created_at DESC LIMIT 50",
      [member.id]
    );

    // Get wallets
    const walletRes = await pool.query(
      'SELECT wallet FROM members_memberwallets WHERE member_id = $1',
      [member.id]
    );

    return NextResponse.json({
      member: {
        discordName: member.discord_name,
        dailyStreak: member.daily_streak,
        perfectDailyMonths: member.perfect_daily_months,
        isSupporter: member.is_supporter,
        createdAt: member.created_at,
      },
      gpBalance: parseInt(gpRes.rows[0].balance),
      recentActivity: activityRes.rows.map((r: any) => ({
        amount: r.amount,
        eventType: r.event_type,
        assignedBy: r.assigned_by,
        data: r.data,
        createdAt: r.created_at,
      })),
      redemptions: redemptionRes.rows.map((r: any) => ({
        amount: r.amount,
        name: r.data?.redemption?.name || r.data?.name || 'Unknown Item',
        createdAt: r.created_at,
      })),
      wallets: walletRes.rows.map((r: any) => r.wallet),
    });
  } catch (error) {
    console.error('Dashboard query error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
