# Shapecraft — landing page

Marketing landing page for **Shapecraft**, a text-to-CAD tool for makers: describe a part in
plain English and get a real, parametric, printable 3D model — split into an assembly when it
needs more than one piece.

The hero features a **type-on demo**: it types a prompt (`create a snap-fit enclosure for a
Raspberry Pi 5`), "sends" it, shows a two-part build (Base → Lid), and reveals the result. The
model renders in `assets/` are a real example built in the app.

## Run it

It's a static site — no build step.

```bash
# any static server works
python3 -m http.server 8080
# then open http://localhost:8080
```

Or just open `index.html` in a browser.

## Structure

| File | What |
| --- | --- |
| `index.html` | Page markup (nav, hero + demo, how-it-works, features, example, CTA, footer) |
| `styles.css` | Dark theme, Shapecraft green accent, responsive |
| `script.js` | The type-on demo state machine + footer year |
| `assets/base.png`, `assets/lid.png` | Example renders (Raspberry Pi 5 enclosure parts) |

## Notes

- The "Get early access" / "Request access" CTAs are placeholders — wire them to a real
  waitlist/form before shipping.
- Respects `prefers-reduced-motion` (shows the finished demo state without animating).
