// ======================================================
// FUGLYMAMMIE
// COMPLETE PUBLIC WEBSITE JAVASCRIPT
// ======================================================


// ======================================================
// 1. SUPABASE CONNECTION
// ======================================================

const SUPABASE_URL = "https://kdrenkxjhhupuvjhpdrk.supabase.co";
const SUPABASE_KEY = "sb_publishable_u-kQrZgBjM35l7xVeBaaCw_sm2vVHXq";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// ======================================================
// 2. GLOBAL DATA
// ======================================================

let eventsData = [];


// ======================================================
// 3. PAGE ELEMENTS
// ======================================================

const feedSection =
    document.getElementById("feed-section");

const eventsSection =
    document.getElementById("events-section");

const feedButton =
    document.getElementById("feed-btn");

const eventsButton =
    document.getElementById("events-btn");

const joinButton =
    document.getElementById("join-btn");

const brandLink =
    document.getElementById("brand-link");

const feedContainer =
    document.getElementById("feed-container");

const upcomingContainer =
    document.getElementById(
        "upcoming-events-container"
    );


// ======================================================
// 4. ESCAPE HTML
// ======================================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ======================================================
// 5. FORMAT EVENT DATE
// 2026-11-12 -> 12 Nov 2026
// ======================================================

function formatEventDate(dateString) {

    if (!dateString) {
        return "";
    }

    const date =
        new Date(
            `${dateString}T00:00:00`
        );

    return date.toLocaleDateString(
        "en-ZA",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


// ======================================================
// 6. CHECK IF DATE IS TODAY OR FUTURE
// ======================================================

function isFutureOrToday(dateString) {

    if (!dateString) {
        return false;
    }

    const eventDate =
        new Date(
            `${dateString}T00:00:00`
        );

    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );

    return eventDate >= today;
}


// ======================================================
// 7. SAFE EXTERNAL URL
// ======================================================

function getSafeURL(url) {

    if (
        !url ||
        url === "#"
    ) {
        return null;
    }

    try {

        const parsedURL =
            new URL(url);

        if (
            parsedURL.protocol === "http:" ||
            parsedURL.protocol === "https:"
        ) {
            return parsedURL.href;
        }

        return null;

    } catch {

        return null;
    }
}


// ======================================================
// 8. LOAD EVENTS FROM SUPABASE
// ======================================================

async function loadEvents() {

    feedContainer.innerHTML = `
        <li class="empty-state">
            Loading...
        </li>
    `;

    upcomingContainer.innerHTML = `
        <li class="empty-state">
            Loading...
        </li>
    `;

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("events")
            .select(`
                id,
                title,
                event_date,
                location,
                description,
                ticket_url,
                status,
                published,
                created_at
            `)
            .eq(
                "published",
                true
            )
            .order(
                "event_date",
                {
                    ascending: false
                }
            );


        if (error) {

            console.error(
                "Supabase event error:",
                error
            );

            throw error;
        }


        eventsData =
            data || [];


        renderFeed();

        renderUpcomingEvents();

    } catch (error) {

        console.error(
            "Could not load events:",
            error
        );


        feedContainer.innerHTML = `
            <li class="empty-state">
                Unable to load updates right now.
            </li>
        `;


        upcomingContainer.innerHTML = `
            <li class="empty-state">
                Unable to load upcoming events.
            </li>
        `;
    }
}


// ======================================================
// 9. RENDER MAIN FEED
// ======================================================

function renderFeed() {

    if (!eventsData.length) {

        feedContainer.innerHTML = `
            <li class="empty-state">
                No updates available.
            </li>
        `;

        return;
    }


    feedContainer.innerHTML =
        eventsData
            .map(event => {

                const status =
                    event.status ||
                    "upcoming";


                const crossedOut =
                    status === "cancelled" ||
                    status === "postponed";


                const locationHTML =
                    event.location
                        ? `
                            <div class="feed-location">
                                ${escapeHTML(
                                    event.location
                                )}
                            </div>
                        `
                        : "";


                const statusHTML =
                    status !== "upcoming"
                        ? `
                            <span class="event-status">
                                ${escapeHTML(
                                    status
                                )}
                            </span>
                        `
                        : "";


                return `
                    <li
                        class="feed-item"
                        data-event-id="${escapeHTML(
                            event.id
                        )}"
                    >

                        <span class="feed-date">
                            ${escapeHTML(
                                formatEventDate(
                                    event.event_date
                                )
                            )}
                        </span>

                        <div
                            class="feed-title ${
                                crossedOut
                                    ? "strikethrough"
                                    : ""
                            }"
                        >
                            ${escapeHTML(
                                event.title
                            )}
                        </div>

                        ${locationHTML}

                        ${statusHTML}

                    </li>
                `;
            })
            .join("");


    addEventListeners();
}


// ======================================================
// 10. RENDER UPCOMING EVENTS
// ======================================================

function renderUpcomingEvents() {

    const upcomingEvents =
        eventsData
            .filter(event => {

                return (
                    event.status === "upcoming" &&
                    isFutureOrToday(
                        event.event_date
                    )
                );
            })
            .sort(
                (a, b) => {

                    return new Date(
                        `${a.event_date}T00:00:00`
                    ) -
                    new Date(
                        `${b.event_date}T00:00:00`
                    );
                }
            );


    if (!upcomingEvents.length) {

        upcomingContainer.innerHTML = `
            <li class="empty-state">
                No upcoming events announced.
            </li>
        `;

        return;
    }


    upcomingContainer.innerHTML =
        upcomingEvents
            .map(event => {

                const locationHTML =
                    event.location
                        ? `
                            <div class="feed-location">
                                ${escapeHTML(
                                    event.location
                                )}
                            </div>
                        `
                        : "";


                return `
                    <li
                        class="feed-item"
                        data-event-id="${escapeHTML(
                            event.id
                        )}"
                    >

                        <span class="feed-date">
                            ${escapeHTML(
                                formatEventDate(
                                    event.event_date
                                )
                            )}
                        </span>

                        <div class="feed-title">
                            ${escapeHTML(
                                event.title
                            )}
                        </div>

                        ${locationHTML}

                    </li>
                `;
            })
            .join("");


    addEventListeners();
}


// ======================================================
// 11. EVENT CLICK LISTENERS
// ======================================================

function addEventListeners() {

    const eventItems =
        document.querySelectorAll(
            "[data-event-id]"
        );


    eventItems.forEach(
        item => {

            item.onclick = () => {

                const eventId =
                    item.dataset.eventId;

                openEventModal(
                    eventId
                );
            };
        }
    );
}


// ======================================================
// 12. SHOW FEED
// ======================================================

function showFeed() {

    feedSection.classList.add(
        "active"
    );

    eventsSection.classList.remove(
        "active"
    );
}


// ======================================================
// 13. SHOW UPCOMING EVENTS
// ======================================================

function showUpcomingEvents() {

    eventsSection.classList.add(
        "active"
    );

    feedSection.classList.remove(
        "active"
    );
}


// ======================================================
// 14. NAVIGATION BUTTONS
// ======================================================

feedButton.addEventListener(
    "click",
    showFeed
);


eventsButton.addEventListener(
    "click",
    showUpcomingEvents
);


brandLink.addEventListener(
    "click",
    event => {

        event.preventDefault();

        showFeed();
    }
);


// ======================================================
// 15. OPEN EVENT MODAL
// ======================================================

function openEventModal(eventId) {

    const event =
        eventsData.find(
            item =>
                item.id === eventId
        );


    if (!event) {
        return;
    }


    document.getElementById(
        "modal-date"
    ).textContent =
        formatEventDate(
            event.event_date
        );


    document.getElementById(
        "modal-title"
    ).textContent =
        event.title || "";


    document.getElementById(
        "modal-location"
    ).textContent =
        event.location || "";


    document.getElementById(
        "modal-body"
    ).textContent =
        event.description || "";


    const ticketButton =
        document.getElementById(
            "modal-ticket-btn"
        );


    const ticketURL =
        getSafeURL(
            event.ticket_url
        );


    if (ticketURL) {

        ticketButton.href =
            ticketURL;

        ticketButton.style.display =
            "inline-block";

    } else {

        ticketButton.style.display =
            "none";
    }


    document.getElementById(
        "event-modal"
    ).classList.add(
        "active"
    );
}


// ======================================================
// 16. CLOSE EVENT MODAL
// ======================================================

document.getElementById(
    "event-modal-close"
).addEventListener(
    "click",
    () => {

        document.getElementById(
            "event-modal"
        ).classList.remove(
            "active"
        );
    }
);


// ======================================================
// 17. OPEN JOIN NETWORK MODAL
// ======================================================

joinButton.addEventListener(
    "click",
    () => {

        document.getElementById(
            "join-message"
        ).textContent = "";

        document.getElementById(
            "join-modal"
        ).classList.add(
            "active"
        );
    }
);


// ======================================================
// 18. CLOSE JOIN NETWORK MODAL
// ======================================================

document.getElementById(
    "join-modal-close"
).addEventListener(
    "click",
    () => {

        document.getElementById(
            "join-modal"
        ).classList.remove(
            "active"
        );
    }
);


// ======================================================
// 19. CLOSE MODAL BY CLICKING BACKGROUND
// ======================================================

document.querySelectorAll(
    ".modal-overlay"
).forEach(
    modal => {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target === modal
                ) {

                    modal.classList.remove(
                        "active"
                    );
                }
            }
        );
    }
);


// ======================================================
// 20. ESC KEY CLOSES MODALS
// ======================================================

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {

            document
                .querySelectorAll(
                    ".modal-overlay"
                )
                .forEach(
                    modal => {

                        modal.classList.remove(
                            "active"
                        );
                    }
                );
        }
    }
);


// ======================================================
// 21. JOIN NETWORK FORM
// SAVE SUBSCRIBER TO SUPABASE
// ======================================================

const joinForm =
    document.getElementById(
        "join-form"
    );

const joinMessage =
    document.getElementById(
        "join-message"
    );


joinForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const firstName =
            document
                .getElementById(
                    "first-name"
                )
                .value
                .trim();


        const lastName =
            document
                .getElementById(
                    "last-name"
                )
                .value
                .trim();


        const email =
            document
                .getElementById(
                    "email"
                )
                .value
                .trim()
                .toLowerCase();


        const city =
            document
                .getElementById(
                    "city"
                )
                .value
                .trim();


        const submitButton =
            joinForm.querySelector(
                ".form-submit"
            );


        // Basic validation
        if (
            !firstName ||
            !lastName ||
            !email
        ) {

            joinMessage.textContent =
                "Please complete the required fields.";

            return;
        }


        joinMessage.textContent = "";


        submitButton.disabled =
            true;


        submitButton.textContent =
            "Joining...";


        try {

            const {
                error
            } = await supabaseClient
                .from("subscribers")
                .insert([
                    {
                        first_name:
                            firstName,

                        last_name:
                            lastName,

                        email:
                            email,

                        city:
                            city || null
                    }
                ]);


            if (error) {

                // Duplicate email
                if (
                    error.code === "23505"
                ) {

                    joinMessage.textContent =
                        "You're already in the network.";

                    return;
                }


                console.error(
                    "Subscriber error:",
                    error
                );


                joinMessage.textContent =
                    "Something went wrong. Please try again.";

                return;
            }


            joinMessage.textContent =
                "You're in. Speak soon.";


            joinForm.reset();


        } catch (error) {

            console.error(
                "Join Network error:",
                error
            );


            joinMessage.textContent =
                "Unable to join right now. Please try again.";

        } finally {

            submitButton.disabled =
                false;


            submitButton.textContent =
                "Join Network";
        }
    }
);


// ======================================================
// 22. SOCIAL LINKS
// Replace these later with Fuglymammie's real accounts
// ======================================================

document.getElementById(
    "instagram-link"
).href =
    "https://instagram.com/fuglymammie";


document.getElementById(
    "x-link"
).href =
    "https://x.com";


// ======================================================
// 23. COPYRIGHT YEAR
// ======================================================

document.getElementById(
    "year"
).textContent =
    new Date().getFullYear();


// ======================================================
// 24. START WEBSITE
// ======================================================

loadEvents();
