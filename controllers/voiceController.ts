import { Request, Response, NextFunction } from 'express';
import Call from '../models/Call';

type MiddlewareFunction = (req: Request, res: Response, next: NextFunction) => void;

export const verifyTrialAccount: MiddlewareFunction = (req, res, next) => {
  const from = req.body.From;
  const verifiedNumbers = [
    process.env.MY_VERIFIED_NUMBER_1
  ].filter(Boolean) as string[];
  
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

export const handleIncomingCall = (req: Request, res: Response) => {
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

export const handleKeyPress = async (req: Request, res: Response) => {
  let digit = req.body.Digits || req.query.Digits;
  const from = req.body.From;
  const to = req.body.To;

  try {
    if (digit === 'TIMEOUT') digit = null;

    if (digit === '1') {
      const call = new Call({
        from,
        to,
        action: 'forwarded',
        forwardedTo: process.env.FORWARD_PHONE_NUMBER,
        status: 'in-progress'
      });
      await call.save();

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
    } else if (digit === '2') {
      const call = new Call({
        from,
        to,
        action: 'voicemail',
        status: 'in-progress'
      });
      await call.save();

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
    } else {
      const response = `<Response>
  <Say>Invalid option. Goodbye!</Say>
  <Hangup/>
</Response>`;
      res.type('text/xml').send(response);
    }
  } catch (error) {
    const errorResponse = `<Response>
  <Say>An error occurred. Please try again later.</Say>
  <Hangup/>
</Response>`;
    res.type('text/xml').send(errorResponse);
  }
};

export const handleCallEnd = async (req: Request, res: Response) => {
  const callId = req.query.callId;
  const status = req.body.CallStatus;
  const duration = req.body.CallDuration || 0;

  try {
    await Call.findByIdAndUpdate(callId, {
      status: status === 'completed' ? 'completed' : 'failed',
      duration: parseInt(duration as string)
    });

    res.status(200).end();
  } catch (error) {
    res.status(500).end();
  }
};

export const handleRecording = async (req: Request, res: Response) => {
  const recordingUrl = req.body.RecordingUrl;
  const callId = req.query.callId;
  const recordingDuration = req.body.RecordingDuration || 0;

  try {
    await Call.findByIdAndUpdate(callId, {
      status: 'completed',
      recordingUrl,
      duration: parseInt(recordingDuration as string)
    });

    const response = `<Response>
  <Say>Thank you for your message. Goodbye!</Say>
  <Hangup/>
</Response>`;
    res.type('text/xml').send(response);
  } catch (error) {
    const errorResponse = `<Response>
  <Say>Error saving your recording</Say>
  <Hangup/>
</Response>`;
    res.type('text/xml').send(errorResponse);
  }
};