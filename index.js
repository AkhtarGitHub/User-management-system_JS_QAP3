// Required modules
const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;
const SALT_ROUNDS = 10;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
    session({
        secret: "replace_this_with_a_secure_key",
        resave: false,
        saveUninitialized: true,
    })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// In-memory user data
const USERS = [
    {
        id: 1,
        username: "AdminUser",
        email: "admin@example.com",
        password: bcrypt.hashSync("admin123", SALT_ROUNDS),
        role: "admin",
    },
    {
        id: 2,
        username: "RegularUser",
        email: "user@example.com",
        password: bcrypt.hashSync("user123", SALT_ROUNDS),
        role: "user",
    },
];

// GET /login - Render login form
app.get("/login", (request, response) => {
    response.render("login");
});

// POST /login - Allows a user to login
app.post("/login", (request, response) => {
    const { email, password } = request.body;
    const user = USERS.find((u) => u.email === email);

    if (!user || !bcrypt.compareSync(password, user.password)) {
        return response.render("login", { error: "Invalid email or password." });
    }

    request.session.user = user;
    response.redirect("/landing");
});

// GET /signup - Render signup form
app.get("/signup", (request, response) => {
    response.render("signup");
});

// POST /signup - Allows a user to signup
app.post("/signup", (request, response) => {
    const { username, email, password } = request.body;

    if (USERS.some((u) => u.email === email)) {
        return response.render("signup", { error: "Email already exists." });
    }

    const newUser = {
        id: USERS.length + 1,
        username,
        email,
        password: bcrypt.hashSync(password, SALT_ROUNDS),
        role: "user", // Default role is regular user
    };

    USERS.push(newUser);
    response.redirect("/login");
});

// GET /landing - Shows a welcome page for users or admin dashboard
app.get("/landing", (request, response) => {
    const user = request.session.user;

    if (!user) {
        return response.redirect("/login");
    }

    if (user.role === "admin") {
        return response.render("landing", { user, users: USERS });
    }

    response.render("landing", { user, users: null });
});

// GET /logout - Logs out the user
app.get("/logout", (request, response) => {
    request.session.destroy((err) => {
        if (err) {
            return response.redirect("/landing");
        }
        response.redirect("/");
    });
});

// GET / - Render index page or redirect to landing if logged in
app.get("/", (request, response) => {
    if (request.session.user) {
        return response.redirect("/landing");
    }
    response.render("index");
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
