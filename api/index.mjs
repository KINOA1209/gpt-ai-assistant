import express from 'express';
import {
  TITLE_AI,
  TITLE_HUMAN,
} from '../services/openai.mjs';
import {
  messages,
  chat,
} from '../engine/index.mjs';
import {
  reply,
} from '../services/line.mjs';
import config from '../config/index.mjs';

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.sendStatus(200);
});

app.post('/webhook', async (req, res) => {
  const events = req.body.events || [];
  const requests = events
    .filter(({ type }) => type === 'message')
    .map(async ({ replyToken, message }) => {
      messages.push(`${TITLE_HUMAN}: ${message.text}？`);
      const context = messages.map((m) => `${m}\n`).join('');
      const { reply: text } = await chat({ context });
      const payload = {
        replyToken,
        messages: [{ type: 'text', text }],
      };
      messages.push(`${TITLE_AI}: ${text}`);
      return config.APP_ENV === 'local' ? payload : reply(payload);
    });
  const responses = await Promise.all(requests);
  res.status(200).send(responses);
});

if (config.APP_ENV === 'local') {
  app.listen('3000');
}

export default app;
