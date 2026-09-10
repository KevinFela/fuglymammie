// ======================================================
// FUGLYMAMMIE CMS
// ADMIN LOGIN
// ======================================================


// ======================================================
// 1. SUPABASE CONNECTION
// ======================================================

const SUPABASE_URL =
    "https://kdrenkxjhhupuvjhpdrk.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_u-kQrZgBjM35l7xVeBaaCw_sm2vVHXq";


if (typeof supabase === "undefined") {

    console.error(
        "Supabase library failed to load."
    );

    throw new Error(
        "Supabase library is not available."
    );
}


const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// ======================================================
// 2. PAGE ELEMENTS
// ======================================================

const loginForm =
    document.getElementById(
        "admin-login-form"
    );

const emailInput =
    document.getElementById(
        "admin-email"
    );

const passwordInput =
    document.getElementById(
        "admin-password"
    );

const loginButton =
    document.getElementById(
        "login-button"
    );

const loginMessage =
    document.getElementById(
        "login-message"
    );

const yearElement =
    document.getElementById(
        "admin-year"
    );


// ======================================================
// 3. COPYRIGHT YEAR
// ======================================================

if (yearElement) {

    yearElement.textContent =
        new Date().getFullYear();
}


// ======================================================
// 4. SHOW MESSAGE
// ======================================================

function showMessage(message) {

    if (!loginMessage) {
        return;
    }

    loginMessage.textContent =
        message;
}


// ======================================================
// 5. CHECK IF USER EXISTS IN ADMINS TABLE
// ======================================================

async function checkAdmin(userId) {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("admins")
                .select(
                    "user_id, email"
                )
                .eq(
                    "user_id",
                    userId
                )
                .maybeSingle();


        if (error) {

            console.error(
                "Admin check error:",
                error
            );

            return false;
        }


        return data !== null;


    } catch (error) {

        console.error(
            "Unexpected admin check error:",
            error
        );

        return false;
    }
}


// ======================================================
// 6. LOGIN
// ======================================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const email =
                emailInput.value
                    .trim()
                    .toLowerCase();


            const password =
                passwordInput.value;


            if (
                !email ||
                !password
            ) {

                showMessage(
                    "Enter your email and password."
                );

                return;
            }


            // Clear previous error
            showMessage("");


            loginButton.disabled =
                true;


            loginButton.textContent =
                "Logging in...";


            try {

                // ======================================
                // LOGIN USING SUPABASE AUTH
                // ======================================

                const {
                    data,
                    error
                } =
                    await supabaseClient
                        .auth
                        .signInWithPassword({
                            email,
                            password
                        });


                // ======================================
                // SHOW REAL SUPABASE ERROR
                // ======================================

                if (error) {

                    console.error(
                        "Supabase login error:",
                        error
                    );


                    showMessage(
                        error.message
                    );


                    return;
                }


                if (
                    !data ||
                    !data.user
                ) {

                    showMessage(
                        "Login failed. No user session was created."
                    );

                    return;
                }


                const user =
                    data.user;


                console.log(
                    "Logged in user:",
                    user.id
                );


                // ======================================
                // CHECK IF USER IS APPROVED ADMIN
                // ======================================

                const isAdmin =
                    await checkAdmin(
                        user.id
                    );


                if (!isAdmin) {

                    console.warn(
                        "User is authenticated but is not an approved admin."
                    );


                    await supabaseClient
                        .auth
                        .signOut();


                    showMessage(
                        "Access denied. This account is not an approved administrator."
                    );


                    return;
                }


                // ======================================
                // SUCCESS
                // ======================================

                showMessage(
                    "Access granted."
                );


                console.log(
                    "Admin verified."
                );


                // Send to dashboard
                window.location.href =
                    "dashboard.html";


            } catch (error) {

                console.error(
                    "Unexpected login error:",
                    error
                );


                showMessage(
                    error.message ||
                    "Something went wrong. Please try again."
                );


            } finally {

                loginButton.disabled =
                    false;


                loginButton.textContent =
                    "Log in";
            }
        }
    );
}


// ======================================================
// 7. CHECK EXISTING SESSION
// ======================================================

async function checkExistingSession() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .getSession();


        if (error) {

            console.error(
                "Session error:",
                error
            );

            return;
        }


        const session =
            data.session;


        // No login session
        if (!session) {

            console.log(
                "No existing admin session."
            );

            return;
        }


        console.log(
            "Existing session found."
        );


        const user =
            session.user;


        if (!user) {
            return;
        }


        // ======================================
        // CHECK ADMIN TABLE
        // ======================================

        const isAdmin =
            await checkAdmin(
                user.id
            );


        if (isAdmin) {

            console.log(
                "Existing admin session verified."
            );


            window.location.href =
                "dashboard.html";


            return;
        }


        // User logged in but not admin
        console.warn(
            "Existing user is not approved admin."
        );


        await supabaseClient
            .auth
            .signOut();


    } catch (error) {

        console.error(
            "Existing session check failed:",
            error
        );
    }
}


// ======================================================
// 8. START ADMIN LOGIN PAGE
// ======================================================

checkExistingSession();