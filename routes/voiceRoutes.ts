import express from 'express';
import {
  verifyTrialAccount,
  handleIncomingCall,
  handleKeyPress,
  handleRecording,
  handleCallEnd
} from '../controllers/voiceController';

const router = express.Router();

router.post('/', verifyTrialAccount, handleIncomingCall);
router.post('/handle-key', verifyTrialAccount, handleKeyPress);
router.post('/handle-recording', handleRecording);
router.post('/handle-call-end', handleCallEnd);

export default router;