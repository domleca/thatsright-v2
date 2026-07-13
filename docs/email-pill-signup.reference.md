# Reference: inline email-pill signup (retired 2026-07-13)

Kept for possible reuse. This was the landing-page signup **before** we switched to
the full-page Tally form (`/apply`). The full original lives in git history at commit
`e683c531` (`git show e683c531:index.html`). Below are the reusable pieces.

It posts an email straight to a **Loops newsletter-form** endpoint and swaps in a
thank-you message in place, without leaving the page. No serverless function needed.

## HTML (inside the `#gate` section)

```html
<form class="form reveal" id="gateForm"
      action="https://app.loops.so/api/newsletter-form/cmqqm4rz22cs60j1mamgq8659" method="POST">
  <label class="visually-hidden" for="gateEmail" data-k="gate_ph"></label>
  <input type="email" id="gateEmail" name="email" autocomplete="email" inputmode="email"
         required spellcheck="false" data-k-ph="gate_ph">
  <button type="submit" data-k="gate_btn"></button>
</form>
<p class="fineprint reveal" data-k="gate_fine"></p>
<p class="form-done" id="gateDone" data-k="gate_done" hidden></p>
<p class="form-err" id="gateErr" data-k="gate_err" hidden></p>
```

## CSS (the combined pill)

```css
.form{
  display:flex;align-items:center;max-width:520px;margin:0 auto;
  background:var(--paper);border:1px solid var(--line);
  border-radius:999px;padding:6px 6px 6px 22px;
  transition:border-color .15s ease;
}
.form:focus-within{border-color:var(--terra)}
.form input{
  flex:1;min-width:0;background:transparent;border:0;outline:none;
  font-family:var(--sans);font-size:15px;color:var(--ink);
  padding:12px 12px 12px 0;
}
.form input::placeholder{color:var(--ink-faint)}
.form button{
  flex:none;font-family:var(--sans);font-size:14px;font-weight:500;
  padding:11px 22px;border:0;border-radius:999px;
  background:var(--terra);color:var(--paper);cursor:pointer;letter-spacing:.01em;
  touch-action:manipulation;
  transition:filter .15s ease, transform .15s ease;
}
.form button:hover{filter:brightness(1.06);transform:translateY(-1px)}
.form[hidden]{display:none}
#gate .form-done{font-family:var(--serif);font-size:21px;line-height:1.5;color:var(--ink);max-width:34ch;margin:8px auto 0}
#gate .form-err{margin-top:16px;font-size:13px;color:var(--terra)}
```

## JS (background submit, no page leave)

```js
// Submit in the background so the visitor never sees the raw {"success":true}
// JSON the endpoint returns; swap in a thank-you message instead.
(function gateForm(){
  const form = document.getElementById("gateForm");
  if(!form) return;
  const btn  = form.querySelector("button[type=submit]");
  const fine = document.querySelector("#gate .fineprint");
  const done = document.getElementById("gateDone");
  const err  = document.getElementById("gateErr");
  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const email = ((form.email && form.email.value) || "").trim();
    if(!email) return;
    if(btn) btn.disabled = true;
    if(err) err.hidden = true;
    try{
      const res  = await fetch(form.action, {
        method: "POST",
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        body: new URLSearchParams({ email })
      });
      const data = await res.json().catch(()=>({}));
      if(!(res.ok && data.success)) throw new Error();
      form.hidden = true;
      if(fine) fine.hidden = true;
      if(done) done.hidden = false;
    }catch(_){
      if(btn) btn.disabled = false;
      if(err) err.hidden = false;
    }
  });
})();
```

## COPY keys it used

`gate_ph` (placeholder), `gate_btn` (button), `gate_done` (success), `gate_err` (error).
These keys still exist in `index.html`'s `COPY` object (kept, unused) so this can drop
back in with minimal work.
