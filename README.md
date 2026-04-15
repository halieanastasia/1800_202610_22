# Rally

## Overview

Rally is a community-driven platform for soccer fans in Vancouver. We solve the 'where is the game on?' problem by mapping out exactly which local venues are streaming FIFA matches. Users can check a venue's stream availability, create watch-party events, and coordinate with other fans so no one ever misses a kickoff.

---

## Features

**Live Venue Mapping:** Instantly see which restaurants, pubs and other venues are actively streaming matches.
**Community Events:** Users can create and join watch-party events at participating venues.
**Status Transparency:** Clear indicators for participating vs. non-participating venues to save fans from a wasted trip.
**Quick Navigation** Users can favourite events and quickly navigate to the listing in their favourites tab.
---

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript, Bootstrap
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Backend**: Firebase for hosting
- **Database**: Firestore

---

## Usage

To run the application locally:

1.  **Clone** the repository.
2.  **Install dependencies** by running `npm install` in the project root directory.
3.  **Start the development server** by running the command: `npm run dev`.
4.  Open your browser and visit the local address shown in your terminal (usually `http://localhost:5173` or similar).

Once the application is running:

1. Sign Up/Login to access the full features of the app.
2. Browse Venues on the main page to see which pubs are streaming the next FIFA match.
3. Create an Event at a participating venue to invite other fans to join your table.
4. Edit Profile in the account section to update your display name, email, or password.

---

## Project Structure

```
1800_202610_22/
├── .firebase/
├── dist/
├── node_modules/
├── src/
│   ├── account.js
│   ├── authentication.js
│   ├── authGuard.js
│   ├── events.js
│   ├── firebase.js
│   ├── index.js
│   ├── loginSignup.js
│   ├── map.js
│   ├── navbar.js
│   ├── protected.js
├── styles/
│   └── style.css
├── account.html
├── .env
├── event.html
├── firebase.json
├── .firebaserc
├── .gitignore
├── images/
├── index.html
├── login-halie.html
├── package-lock.html
├── package.json
├── README.md
├── vite.config.js

```

---

## Contributors

- **Suzy** - BCIT CST Student with a passion for outdoor adventures and user-friendly applications. Fun fact: Fall in love with cats
- **Thien** - BCIT CST Student, new to codes and program. Fun fact: Like cooking
- **Winston** - BCIT CST Student, sometimes funny. Funny joke: When does a joke become a dad joke? When it becomes apparent.
- **Halie Favron** - BCIT CST Student with a passion for dogs and well planned code. Fun fact: Loves hanging out with my dog.

## Acknowledgments

- Code snippets were adapted from resources such as [1800 Tech Tips (202610)](https://bcit-cst.notion.site/1800-Tech-Tips-202610-3176dfaf038a80109784ffdf607e595c?pvs=21) 
- Some code snippets were analyzed, rewritten and used with the assistance of generative AI sources such as [Gemini] (https://gemini.google.com/), [ChatGPT] (https://chatgpt.com/), [Claude] (https://claude.ai)
- Map API sourced from [MapLibre] (https://maplibre.org/)
- Icons sourced from [Google Fonts](https://fonts.google.com/)
- We would like to thank Carly Orr for her invaluable input and guiding us to where we are now.

---

## Limitations and Future Work

### Limitations

- Limited filter functions.
- Limited user account features.
- Accessibility features can be further improved.
- Not a lot of exposure to the name of the app.

### Future Work

- Add more filtering and sorting options (e.g., by time, distance).
- Make listings clickable and sends the user to its respective location.
- Give more information about the event locations (e.g. hours, phone number, etc.)
- Add a central location for the app title.
- Allows users to collaborate with each other

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.
