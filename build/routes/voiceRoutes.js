"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const voiceController_1 = require("../controllers/voiceController");
const router = express_1.default.Router();
router.post('/', voiceController_1.verifyTrialAccount, voiceController_1.handleIncomingCall);
router.post('/handle-key', voiceController_1.verifyTrialAccount, voiceController_1.handleKeyPress);
router.post('/handle-recording', voiceController_1.handleRecording);
router.post('/handle-call-end', voiceController_1.handleCallEnd);
exports.default = router;
