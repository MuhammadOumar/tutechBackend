"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRecording = exports.handleCallEnd = exports.handleKeyPress = exports.handleIncomingCall = exports.verifyTrialAccount = void 0;
const Call_1 = __importDefault(require("../models/Call"));
const verifyTrialAccount = (req, res, next) => {
    const from = req.body.From;
    const verifiedNumbers = [
        process.env.MY_VERIFIED_NUMBER_1
    ].filter(Boolean);
    if (!verifiedNumbers.includes(from)) {
        console.warn(`Unauthorized call attempt from: ${from}`);
        const response = `<Response>
  <Say>Please add this number to your Twilio verified caller IDs</Say>
  <Hangup/>
</Response>`;
        return res.type('text/xml').send(response);
    }
    next();
};
exports.verifyTrialAccount = verifyTrialAccount;
const handleIncomingCall = (req, res) => {
    const response = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather 
    numDigits="1" 
    action="/voice/handle-key" 
    method="POST"
    timeout="10"
    input="dtmf"
  >
    <Say voice="alice" language="en-US">
      Press 1 to speak with support. Press 2 to leave a voicemail.
    </Say>
  </Gather>
  <Redirect method="POST">/voice/handle-key?Digits=TIMEOUT</Redirect>
</Response>`;
    res.type('text/xml').send(response);
};
exports.handleIncomingCall = handleIncomingCall;
const handleKeyPress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let digit = req.body.Digits || req.query.Digits;
    const from = req.body.From;
    const to = req.body.To;
    try {
        if (digit === 'TIMEOUT')
            digit = null;
        if (digit === '1') {
            const call = new Call_1.default({
                from,
                to,
                action: 'forwarded',
                forwardedTo: process.env.FORWARD_PHONE_NUMBER,
                status: 'in-progress'
            });
            yield call.save();
            const response = `<Response>
  <Say>Connecting you to support</Say>
  <Dial 
    callerId="${to}"
    action="/voice/handle-call-end?callId=${call._id}"
  >
    ${process.env.FORWARD_PHONE_NUMBER}
  </Dial>
</Response>`;
            res.type('text/xml').send(response);
        }
        else if (digit === '2') {
            const call = new Call_1.default({
                from,
                to,
                action: 'voicemail',
                status: 'in-progress'
            });
            yield call.save();
            const response = `<Response>
  <Say>Please leave your message after the beep.</Say>
  <Record 
    action="/voice/handle-recording?callId=${call._id}" 
    method="POST"
    maxLength="120"
    playBeep="true"
  />
</Response>`;
            res.type('text/xml').send(response);
        }
        else {
            const response = `<Response>
  <Say>Invalid option. Goodbye!</Say>
  <Hangup/>
</Response>`;
            res.type('text/xml').send(response);
        }
    }
    catch (error) {
        const errorResponse = `<Response>
  <Say>An error occurred. Please try again later.</Say>
  <Hangup/>
</Response>`;
        res.type('text/xml').send(errorResponse);
    }
});
exports.handleKeyPress = handleKeyPress;
const handleCallEnd = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const callId = req.query.callId;
    const status = req.body.CallStatus;
    const duration = req.body.CallDuration || 0;
    try {
        yield Call_1.default.findByIdAndUpdate(callId, {
            status: status === 'completed' ? 'completed' : 'failed',
            duration: parseInt(duration)
        });
        res.status(200).end();
    }
    catch (error) {
        res.status(500).end();
    }
});
exports.handleCallEnd = handleCallEnd;
const handleRecording = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const recordingUrl = req.body.RecordingUrl;
    const callId = req.query.callId;
    const recordingDuration = req.body.RecordingDuration || 0;
    try {
        yield Call_1.default.findByIdAndUpdate(callId, {
            status: 'completed',
            recordingUrl,
            duration: parseInt(recordingDuration)
        });
        const response = `<Response>
  <Say>Thank you for your message. Goodbye!</Say>
  <Hangup/>
</Response>`;
        res.type('text/xml').send(response);
    }
    catch (error) {
        const errorResponse = `<Response>
  <Say>Error saving your recording</Say>
  <Hangup/>
</Response>`;
        res.type('text/xml').send(errorResponse);
    }
});
exports.handleRecording = handleRecording;
