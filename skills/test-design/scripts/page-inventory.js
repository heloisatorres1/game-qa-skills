// Lists what a tester needs from one web page: forms, fields with their limits
// (required, maxlength, min, max, pattern), buttons, links, headings and
// test ids. Plain browser JavaScript: paste it into any browser tool that can
// evaluate code (Playwright page.evaluate, DevTools console, browser agents).
// The last expression is the result, as a JSON-ready object.

(() => {
  const text = (el) => (el?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120);
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
  };
  const testId = (el) => el.getAttribute('data-test') || el.getAttribute('data-testid') || el.getAttribute('data-cy') || el.getAttribute('data-qa') || undefined;

  const labelOf = (el) => {
    if (el.getAttribute('aria-label')) return el.getAttribute('aria-label');
    const by = el.getAttribute('aria-labelledby');
    if (by) return by.split(/\s+/).map((id) => text(document.getElementById(id))).join(' ');
    if (el.id) {
      const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (l) return text(l);
    }
    const wrap = el.closest('label');
    if (wrap) return text(wrap);
    return undefined;
  };

  const attrs = ['required', 'minlength', 'maxlength', 'min', 'max', 'step', 'pattern', 'inputmode', 'autocomplete', 'accept', 'multiple', 'readonly', 'disabled'];
  const field = (el) => {
    const f = {
      tag: el.tagName.toLowerCase(),
      type: el.type || undefined,
      name: el.name || undefined,
      id: el.id || undefined,
      label: labelOf(el),
      placeholder: el.getAttribute('placeholder') || undefined,
      testId: testId(el),
      visible: visible(el),
    };
    for (const a of attrs) if (el.hasAttribute(a)) f[a] = el.getAttribute(a) === '' ? true : el.getAttribute(a);
    if (el.tagName === 'SELECT') f.options = [...el.options].map((o) => ({ value: o.value, text: text(o) }));
    if (!f.label && !f.placeholder) f.note = 'no label or placeholder (accessibility)';
    return f;
  };

  const button = (el) => ({
    text: text(el) || el.value || el.getAttribute('aria-label') || undefined,
    type: el.type || undefined,
    testId: testId(el),
    disabled: el.disabled || el.getAttribute('aria-disabled') === 'true' || undefined,
    visible: visible(el),
  });

  const FIELD_SEL = 'input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]), select, textarea';
  const BUTTON_SEL = 'button, input[type=submit], input[type=button], input[type=reset], [role=button]';

  const forms = [...document.forms].map((form, i) => ({
    index: i,
    id: form.id || undefined,
    name: form.getAttribute('name') || undefined,
    action: form.getAttribute('action') || undefined,
    method: (form.getAttribute('method') || 'get').toLowerCase(),
    novalidate: form.noValidate || undefined,
    fields: [...form.querySelectorAll(FIELD_SEL)].map(field),
    buttons: [...form.querySelectorAll(BUTTON_SEL)].map(button),
  }));

  const outsideFields = [...document.querySelectorAll(FIELD_SEL)].filter((el) => !el.form).map(field);
  const outsideButtons = [...document.querySelectorAll(BUTTON_SEL)].filter((el) => !el.closest('form')).map(button);

  const links = [...document.querySelectorAll('a[href]')].map((a) => ({ text: text(a) || a.getAttribute('aria-label') || undefined, href: a.href, testId: testId(a) }));
  const sameOrigin = links.filter((l) => { try { return new URL(l.href).origin === location.origin; } catch { return false; } });

  const imgs = [...document.images];
  const errorsShown = [...document.querySelectorAll('[role=alert], .error, [class*=error i], [data-test*=error i]')].filter(visible).map(text).filter(Boolean);

  return {
    url: location.href,
    title: document.title,
    lang: document.documentElement.lang || undefined,
    headings: [...document.querySelectorAll('h1, h2, h3')].map((h) => `${h.tagName.toLowerCase()}: ${text(h)}`),
    forms,
    fieldsOutsideForms: outsideFields,
    buttonsOutsideForms: outsideButtons,
    links: { total: links.length, sameOrigin: sameOrigin.length, list: sameOrigin.slice(0, 80) },
    images: { total: imgs.length, withoutAlt: imgs.filter((i) => !i.hasAttribute('alt')).length },
    testIds: document.querySelectorAll('[data-test], [data-testid], [data-cy], [data-qa]').length,
    errorsShown,
    storage: { localStorageKeys: Object.keys(localStorage), cookies: document.cookie ? document.cookie.split(';').length : 0 },
  };
})();
