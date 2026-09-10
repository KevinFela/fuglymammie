// ======================================================
// FUGLYMAMMIE CMS
// ADMIN LOGIN
// ======================================================

const SUPABASE_URL =
    "https://kdrenkxjhhupuvjhpdrk.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_u-kQrZgBjM35l7xVeBaaCw_sm2vVHXq";


const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


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


if (yearElement) {
    yearElement.textContent =
        new Date().getFullYear();
}


function showMessage(message) {

    if (loginMessage) {
        loginMessage.textContent =
            message;
    }
}


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


        return !!data;


    } catch (error) {

        console.error(
            "Admin check failed:",
            error
        );

        return false;
    }
}


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


            if (!email || !password) {

                showMessage(
                    "Enter your email and password."
                );

                return;
            }


            showMessage("");


            loginButton.disabled = true;

            loginButton.textContent =
                "Logging in...";


            try {

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


                if (error) {

                    console.error(
                        "Login error:",
                        error
                    );

                    showMessage(
                        error.message
                    );

                    return;
                }


                if (!data.user) {

                    showMessage(
                        "Unable to log in."
                    );

                    return;
                }


                const isAdmin =
                    await checkAdmin(
                        data.user.id
                    );


                if (!isAdmin) {

                    await supabaseClient
                        .auth
                        .signOut();


                    showMessage(
                        "Access denied."
                    );

                    return;
                }


                showMessage(
                    "Access granted."
                );


                // CLEAN URL
                window.location.href =
                    "dashboard/";


            } catch (error) {

                console.error(
                    "Login failed:",
                    error
                );


                showMessage(
                    error.message ||
                    "Something went wrong."
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
// EXISTING SESSION
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


        if (
            error ||
            !data.session
        ) {
            return;
        }


        const isAdmin =
            await checkAdmin(
                data.session.user.id
            );


        if (isAdmin) {

            // CLEAN URL
            window.location.href =
                "dashboard/";

            return;
        }


        await supabaseClient
            .auth
            .signOut();


    } catch (error) {

        console.error(
            "Session check error:",
            error
        );
    }
}


checkExistingSession();