import express from 'express';
import { Router, Request, Response, RequestHandler } from 'express';
import { getUserInfo, expireTrialsForWallet } from './db.js';

const router = Router();


// GET /api/users/:walletAddress/points
// Returns { walletAddress, points, trial_expires_at }
const pointsHandler: RequestHandler = async (req, res) => {
  try {
    const { walletAddress } = req.params as { walletAddress: string };
    if (!walletAddress) { res.status(400).json({ error: 'walletAddress required' }); return; }

    // Ensure expired trials are processed before returning balance
    try {
      await expireTrialsForWallet(walletAddress);
    } catch (err) {
      // non-fatal
      console.error('Error expiring trials for balance check:', err);
    }

    const info = await getUserInfo(walletAddress);
    if (!info) { res.status(404).json({ error: 'User not found' }); return; }

    res.json({ walletAddress, points: info.prompt_points, trial_expires_at: info.trial_expires_at });
  } catch (err) {
    console.error('Error fetching user points:', err);
    res.status(500).json({ error: 'Failed to fetch user points' });
  }
};

router.get('/users/:walletAddress/points', pointsHandler);

export default router;
