# Akhil Hotel — Hotel Booking Website

A modern, responsive one-page website for a boutique hotel, built with plain HTML, CSS and JavaScript — no frameworks or build step.

## Features

- **Hero slideshow** with smooth cross-fades and a sticky header that turns solid on scroll
- **Booking widget** — pick dates, room and guests; it validates the dates, limits guests to the room's capacity, calculates nights and total price (with an automatic 15% discount for stays of 3+ nights) and shows a summary
- **Booking requests & contact form** open the visitor's email app with all details pre-filled (no server needed)
- **Rooms & suites** cards with prices and included amenities; "Book Now" preselects the room
- Amenities, About (animated rating bars and counters), Gallery with a lightbox, Guest reviews, Special offer and Contact sections
- Fully responsive (mobile menu, phone-friendly forms), accessible (keyboard navigation, labels, alt text, skip link) and respects "reduced motion" settings
- Optimised images and lightweight inline SVG icons

## Project structure

```
index.html      Page markup
css/style.css   All styles (colours and fonts are set as variables at the top)
js/main.js      Interactions: header, slideshow, booking, forms, gallery
images/         Photos, logo and favicon
```

## Running locally

Just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Customising

- **Prices and room capacity:** update both the room cards in `index.html` and the `ROOMS` object at the top of `js/main.js`.
- **Email that receives requests:** change `HOTEL_EMAIL` in `js/main.js` (and the contact details in `index.html`).
- **Colours / fonts:** edit the variables in `:root` at the top of `css/style.css`.
- The reviews, statistics and room sizes are sample content — replace them with your real figures.
- To receive form submissions without the visitor's email app, point the forms at a service such as Formspree or Netlify Forms.
