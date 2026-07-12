// Receives Tally form submissions and triggers a Loops transactional auto-reply.
//
// One endpoint serves both signup forms. Which auto-reply gets sent is decided
// by the Tally formId in the payload (the slug in tally.so/r/<formId>).
//
// Environment variables (set in Vercel project settings, never committed):
//   LOOPS_API_KEY        required  - Bearer token for the Loops API
//   TALLY_SIGNING_SECRET optional  - if set, incoming webhooks must carry a valid
//                                    Tally-Signature header (see Tally webhook docs)

const crypto = require('crypto');

// Tally formId -> Loops transactional template id.
const FORMS_TO_TEMPLATES = {
  rj1PZ5: 'cmri128z703au0j12ynhofrth', // FR - Signup auto-response
  RGre8j: 'cmri28ykc0w3y0j3ydqfi5h2l', // EN - Signup auto-response
};

const LOOPS_ENDPOINT = 'https://app.loops.so/api/v1/transactional';

// Pull the applicant's email out of Tally's fields array. Prefer the typed email
// field; fall back to a label match so a form tweak doesn't silently break it.
function extractEmail(fields) {
  if (!Array.isArray(fields)) return null;
  const byType = fields.find((f) => f && f.type === 'INPUT_EMAIL' && f.value);
  if (byType) return String(byType.value).trim();
  const byLabel = fields.find(
    (f) => f && typeof f.label === 'string' && /e-?mail|courriel/i.test(f.label) && f.value
  );
  return byLabel ? String(byLabel.value).trim() : null;
}

// Verify Tally's HMAC-SHA256 signature over the JSON payload.
// Returns true when no secret is configured (verification opt-in).
function isValidSignature(payload, signatureHeader, secret) {
  if (!secret) return true;
  if (!signatureHeader) return false;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('base64');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signatureHeader));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function sendLoopsAutoReply(templateId, email, apiKey) {
  const response = await fetch(LOOPS_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ transactionalId: templateId, email }),
  });
  const body = await response.text();
  return { ok: response.ok, status: response.status, body };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const payload = req.body || {};
  const data = payload.data || {};

  if (!isValidSignature(payload, req.headers['tally-signature'], process.env.TALLY_SIGNING_SECRET)) {
    console.warn('[tally-webhook] invalid signature, rejecting');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const formId = data.formId;

  // Acknowledge (200) for cases where retrying would not help, so Tally stops.
  if (!(formId in FORMS_TO_TEMPLATES)) {
    console.warn(`[tally-webhook] unknown formId "${formId}", ignoring`);
    return res.status(200).json({ ok: true, note: 'unknown form' });
  }

  const templateId = FORMS_TO_TEMPLATES[formId];
  if (!templateId) {
    console.warn(`[tally-webhook] no template for formId "${formId}" (EN pending), no email sent`);
    return res.status(200).json({ ok: true, note: 'template pending' });
  }

  const email = extractEmail(data.fields);
  if (!email) {
    console.warn(`[tally-webhook] no email in submission for formId "${formId}"`);
    return res.status(200).json({ ok: true, note: 'no email found' });
  }

  const apiKey = process.env.LOOPS_API_KEY;
  if (!apiKey) {
    console.error('[tally-webhook] LOOPS_API_KEY is not set');
    return res.status(500).json({ error: 'Server not configured' });
  }

  try {
    const result = await sendLoopsAutoReply(templateId, email, apiKey);
    if (!result.ok) {
      // 502 lets Tally retry a transient Loops failure.
      console.error(`[tally-webhook] Loops returned ${result.status}: ${result.body}`);
      return res.status(502).json({ error: 'Loops send failed', status: result.status });
    }
    console.log(`[tally-webhook] auto-reply sent to ${email} (form ${formId})`);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(`[tally-webhook] send threw: ${err && err.message}`);
    return res.status(502).json({ error: 'Loops send threw' });
  }
};

// Exposed for local testing (does not affect the Vercel function contract).
module.exports.extractEmail = extractEmail;
module.exports.isValidSignature = isValidSignature;
module.exports.FORMS_TO_TEMPLATES = FORMS_TO_TEMPLATES;
