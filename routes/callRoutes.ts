import express from 'express';
import Call from '../models/Call';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const calls = await Call.find().sort({ timestamp: -1 });
    res.json(calls);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;