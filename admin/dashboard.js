// ======================================================
// FUGLYMAMMIE CMS
// DASHBOARD
// ======================================================


// ======================================================
// 1. SUPABASE CONNECTION
// ======================================================

const SUPABASE_URL =
    "https://kdrenkxjhhupuvjhpdrk.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_u-kQrZgBjM35l7xVeBaaCw_sm2vVHXq";


const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// ======================================================
// 2. GLOBAL DATA
// ======================================================

let adminEvents = [];
let subscribers = [];


// ======================================================
// 3. ELEMENTS
// ======================================================

const logoutButton =
    document.getElementById("logout-button");

const adminEventsList =
    document.getElementById("admin-events-list");

const subscriberList =
    document.getElementById("subscriber-list");

const totalEventsElement =
    document.getElementById("total-events");

const upcomingEventsCountElement =
    document.getElementById("upcoming-events-count");

const subscriberCountElement =
    document.getElementById("subscriber-count");


const addEventButton =
    document.getElementById("add-event-button");

const overviewAddEventButton =
    document.getElementById("overview-add-event");


const eventEditorModal =
    document.getElementById("event-editor-modal");

const closeEventEditorButton =
    document.getElementById("close-event-editor");

const eventForm =
    document.getElementById("event-form");

const eventFormHeading =
    document.getElementById("event-form-heading");

const eventFormMessage =
    document.getElementById("event-form-message");

const saveEventButton =
    document.getElementById("save-event-button");


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
// 5. FORMAT DATE
// ======================================================

function formatDate(dateString) {

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
// 6. FORMAT DATE + TIME
// ======================================================

function formatDateTime(dateString) {

    if (!dateString) {
        return "";
    }

    const date =
        new Date(dateString);

    return date.toLocaleString(
        "en-ZA",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


// ======================================================
// 7. CHECK ADMIN SESSION
// ======================================================

async function requireAdmin() {

    try {

        const {
            data: {
                session
            },
            error
        } =
            await supabaseClient
                .auth
                .getSession();


        if (
            error ||
            !session
        ) {

            window.location.href =
                "index.html";

            return null;
        }


        const {
            data: admin,
            error: adminError
        } =
            await supabaseClient
                .from("admins")
                .select("user_id, email")
                .eq(
                    "user_id",
                    session.user.id
                )
                .maybeSingle();


        if (
            adminError ||
            !admin
        ) {

            await supabaseClient
                .auth
                .signOut();


            window.location.href =
                "index.html";

            return null;
        }


        return session.user;


    } catch (error) {

        console.error(
            "Admin authentication error:",
            error
        );


        window.location.href =
            "index.html";

        return null;
    }
}


// ======================================================
// 8. LOAD EVENTS
// ======================================================

async function loadAdminEvents() {

    adminEventsList.innerHTML = `
        <p class="dashboard-loading">
            Loading events...
        </p>
    `;


    const {
        data,
        error
    } =
        await supabaseClient
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
                created_at,
                updated_at
            `)
            .order(
                "event_date",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Load events error:",
            error
        );


        adminEventsList.innerHTML = `
            <p class="dashboard-loading">
                Unable to load events.
            </p>
        `;

        return;
    }


    adminEvents =
        data || [];


    renderAdminEvents();

    updateDashboardStats();
}


// ======================================================
// 9. LOAD SUBSCRIBERS
// ======================================================

async function loadSubscribers() {

    subscriberList.innerHTML = `
        <p class="dashboard-loading">
            Loading subscribers...
        </p>
    `;


    const {
        data,
        error
    } =
        await supabaseClient
            .from("subscribers")
            .select(`
                id,
                first_name,
                last_name,
                email,
                city,
                created_at
            `)
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Load subscribers error:",
            error
        );


        subscriberList.innerHTML = `
            <p class="dashboard-loading">
                Unable to load subscribers.
            </p>
        `;

        return;
    }


    subscribers =
        data || [];


    renderSubscribers();

    updateDashboardStats();
}


// ======================================================
// 10. DASHBOARD STATS
// ======================================================

function updateDashboardStats() {

    const upcomingCount =
        adminEvents.filter(
            event =>
                event.status === "upcoming"
        ).length;


    totalEventsElement.textContent =
        adminEvents.length;


    upcomingEventsCountElement.textContent =
        upcomingCount;


    subscriberCountElement.textContent =
        subscribers.length;
}


// ======================================================
// 11. RENDER EVENTS
// ======================================================

function renderAdminEvents() {

    if (!adminEvents.length) {

        adminEventsList.innerHTML = `
            <p class="dashboard-loading">
                No events yet.
            </p>
        `;

        return;
    }


    adminEventsList.innerHTML =
        adminEvents
            .map(event => {

                const publishedText =
                    event.published
                        ? "Published"
                        : "Hidden";


                const location =
                    event.location
                        ? escapeHTML(
                            event.location
                        )
                        : "No location";


                let postponeButton =
                    "Postpone";


                if (
                    event.status ===
                    "postponed"
                ) {

                    postponeButton =
                        "Set Upcoming";
                }


                return `
                    <article class="admin-list-item">

                        <div class="admin-list-main">

                            <span class="admin-list-date">
                                ${escapeHTML(
                                    formatDate(
                                        event.event_date
                                    )
                                )}
                            </span>

                            <div class="admin-list-title">
                                ${escapeHTML(
                                    event.title
                                )}
                            </div>

                            <div class="admin-list-meta">

                                ${location}

                                ·

                                ${escapeHTML(
                                    event.status
                                )}

                                ·

                                ${publishedText}

                            </div>

                        </div>


                        <div class="admin-list-actions">

                            <button
                                class="admin-action-button"
                                data-action="edit"
                                data-id="${event.id}"
                                type="button"
                            >
                                Edit
                            </button>


                            <button
                                class="admin-action-button"
                                data-action="postpone"
                                data-id="${event.id}"
                                type="button"
                            >
                                ${postponeButton}
                            </button>


                            <button
                                class="admin-action-button"
                                data-action="cancel"
                                data-id="${event.id}"
                                type="button"
                            >
                                Cancel
                            </button>


                            <button
                                class="admin-action-button"
                                data-action="publish"
                                data-id="${event.id}"
                                type="button"
                            >
                                ${
                                    event.published
                                        ? "Hide"
                                        : "Publish"
                                }
                            </button>


                            <button
                                class="admin-action-button danger"
                                data-action="delete"
                                data-id="${event.id}"
                                type="button"
                            >
                                Delete
                            </button>

                        </div>

                    </article>
                `;
            })
            .join("");
}


// ======================================================
// 12. RENDER SUBSCRIBERS
// ======================================================

function renderSubscribers() {

    if (!subscribers.length) {

        subscriberList.innerHTML = `
            <p class="dashboard-loading">
                No subscribers yet.
            </p>
        `;

        return;
    }


    subscriberList.innerHTML =
        subscribers
            .map(subscriber => {

                const fullName =
                    `${subscriber.first_name || ""}
                    ${subscriber.last_name || ""}`
                        .trim();


                return `
                    <article class="admin-list-item">

                        <div class="admin-list-main">

                            <div class="subscriber-email">
                                ${escapeHTML(
                                    subscriber.email
                                )}
                            </div>

                            <div class="subscriber-name">
                                ${escapeHTML(
                                    fullName
                                )}
                            </div>

                            <div class="subscriber-city">

                                ${
                                    subscriber.city
                                        ? escapeHTML(
                                            subscriber.city
                                        )
                                        : "No city"
                                }

                                · joined

                                ${escapeHTML(
                                    formatDateTime(
                                        subscriber.created_at
                                    )
                                )}

                            </div>

                        </div>

                    </article>
                `;
            })
            .join("");
}


// ======================================================
// 13. DASHBOARD NAVIGATION
// ======================================================

document
    .querySelectorAll(
        ".dashboard-nav-button"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const section =
                    button.dataset.section;


                document
                    .querySelectorAll(
                        ".dashboard-nav-button"
                    )
                    .forEach(item => {

                        item.classList.remove(
                            "active"
                        );
                    });


                button.classList.add(
                    "active"
                );


                document
                    .querySelectorAll(
                        ".dashboard-section"
                    )
                    .forEach(sectionElement => {

                        sectionElement.classList.remove(
                            "active"
                        );
                    });


                const target =
                    document.getElementById(
                        `${section}-section`
                    );


                if (target) {

                    target.classList.add(
                        "active"
                    );
                }
            }
        );
    });


// ======================================================
// 14. OPEN ADD EVENT MODAL
// ======================================================

function openAddEventModal() {

    eventForm.reset();


    document.getElementById(
        "event-id"
    ).value = "";


    document.getElementById(
        "event-status"
    ).value =
        "upcoming";


    document.getElementById(
        "event-published"
    ).checked =
        true;


    eventFormHeading.textContent =
        "Add Event";


    saveEventButton.textContent =
        "Publish Event";


    eventFormMessage.textContent =
        "";


    eventEditorModal.classList.add(
        "active"
    );
}


// ======================================================
// 15. OPEN EDIT EVENT MODAL
// ======================================================

function openEditEventModal(eventId) {

    const event =
        adminEvents.find(
            item =>
                item.id === eventId
        );


    if (!event) {
        return;
    }


    document.getElementById(
        "event-id"
    ).value =
        event.id;


    document.getElementById(
        "event-title"
    ).value =
        event.title || "";


    document.getElementById(
        "event-date"
    ).value =
        event.event_date || "";


    document.getElementById(
        "event-location"
    ).value =
        event.location || "";


    document.getElementById(
        "event-description"
    ).value =
        event.description || "";


    document.getElementById(
        "event-ticket-url"
    ).value =
        event.ticket_url || "";


    document.getElementById(
        "event-status"
    ).value =
        event.status || "upcoming";


    document.getElementById(
        "event-published"
    ).checked =
        event.published;


    eventFormHeading.textContent =
        "Edit Event";


    saveEventButton.textContent =
        "Save Changes";


    eventFormMessage.textContent =
        "";


    eventEditorModal.classList.add(
        "active"
    );
}


// ======================================================
// 16. CLOSE EVENT MODAL
// ======================================================

function closeEventModal() {

    eventEditorModal.classList.remove(
        "active"
    );


    eventFormMessage.textContent =
        "";
}


// ======================================================
// 17. ADD EVENT BUTTONS
// ======================================================

addEventButton.addEventListener(
    "click",
    openAddEventModal
);


overviewAddEventButton.addEventListener(
    "click",
    openAddEventModal
);


closeEventEditorButton.addEventListener(
    "click",
    closeEventModal
);


// ======================================================
// 18. SAVE EVENT
// ======================================================

eventForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const eventId =
            document
                .getElementById(
                    "event-id"
                )
                .value;


        const title =
            document
                .getElementById(
                    "event-title"
                )
                .value
                .trim();


        const eventDate =
            document
                .getElementById(
                    "event-date"
                )
                .value;


        const location =
            document
                .getElementById(
                    "event-location"
                )
                .value
                .trim();


        const description =
            document
                .getElementById(
                    "event-description"
                )
                .value
                .trim();


        const ticketUrl =
            document
                .getElementById(
                    "event-ticket-url"
                )
                .value
                .trim();


        const status =
            document
                .getElementById(
                    "event-status"
                )
                .value;


        let published =
            document
                .getElementById(
                    "event-published"
                )
                .checked;


        // Draft events should never appear
        // on the public website.

        if (
            status === "draft"
        ) {

            published = false;
        }


        if (
            !title ||
            !eventDate
        ) {

            eventFormMessage.textContent =
                "Title and date are required.";

            return;
        }


        const eventData = {

            title:
                title,

            event_date:
                eventDate,

            location:
                location || null,

            description:
                description || null,

            ticket_url:
                ticketUrl || null,

            status:
                status,

            published:
                published,

            updated_at:
                new Date().toISOString()
        };


        saveEventButton.disabled =
            true;


        saveEventButton.textContent =
            eventId
                ? "Saving..."
                : "Publishing...";


        eventFormMessage.textContent =
            "";


        try {

            let result;


            if (eventId) {

                result =
                    await supabaseClient
                        .from("events")
                        .update(eventData)
                        .eq(
                            "id",
                            eventId
                        );

            } else {

                result =
                    await supabaseClient
                        .from("events")
                        .insert([
                            eventData
                        ]);
            }


            if (result.error) {

                throw result.error;
            }


            eventFormMessage.textContent =
                eventId
                    ? "Event updated."
                    : "Event created.";


            await loadAdminEvents();


            setTimeout(
                () => {

                    closeEventModal();

                },
                500
            );


        } catch (error) {

            console.error(
                "Save event error:",
                error
            );


            eventFormMessage.textContent =
                "Unable to save event.";

        } finally {

            saveEventButton.disabled =
                false;


            saveEventButton.textContent =
                eventId
                    ? "Save Changes"
                    : "Publish Event";
        }
    }
);


// ======================================================
// 19. QUICK UPDATE EVENT
// ======================================================

async function updateEvent(
    eventId,
    changes
) {

    const {
        error
    } =
        await supabaseClient
            .from("events")
            .update({
                ...changes,

                updated_at:
                    new Date().toISOString()
            })
            .eq(
                "id",
                eventId
            );


    if (error) {

        console.error(
            "Update event error:",
            error
        );


        alert(
            "Unable to update event."
        );

        return false;
    }


    await loadAdminEvents();

    return true;
}


// ======================================================
// 20. EVENT ACTION BUTTONS
// ======================================================

adminEventsList.addEventListener(
    "click",
    async event => {

        const button =
            event.target.closest(
                "[data-action]"
            );


        if (!button) {
            return;
        }


        const eventId =
            button.dataset.id;


        const action =
            button.dataset.action;


        const selectedEvent =
            adminEvents.find(
                item =>
                    item.id === eventId
            );


        if (!selectedEvent) {
            return;
        }


        // EDIT

        if (
            action === "edit"
        ) {

            openEditEventModal(
                eventId
            );

            return;
        }


        // POSTPONE / RESTORE

        if (
            action === "postpone"
        ) {

            if (
                selectedEvent.status ===
                "postponed"
            ) {

                await updateEvent(
                    eventId,
                    {
                        status:
                            "upcoming"
                    }
                );

            } else {

                await updateEvent(
                    eventId,
                    {
                        status:
                            "postponed"
                    }
                );
            }

            return;
        }


        // CANCEL

        if (
            action === "cancel"
        ) {

            const confirmed =
                confirm(
                    `Cancel "${selectedEvent.title}"?`
                );


            if (!confirmed) {
                return;
            }


            await updateEvent(
                eventId,
                {
                    status:
                        "cancelled"
                }
            );


            return;
        }


        // PUBLISH / HIDE

        if (
            action === "publish"
        ) {

            let newStatus =
                selectedEvent.status;


            // Publishing a draft converts
            // it to upcoming.

            if (
                !selectedEvent.published &&
                selectedEvent.status ===
                "draft"
            ) {

                newStatus =
                    "upcoming";
            }


            await updateEvent(
                eventId,
                {
                    published:
                        !selectedEvent.published,

                    status:
                        newStatus
                }
            );


            return;
        }


        // DELETE

        if (
            action === "delete"
        ) {

            const confirmed =
                confirm(
                    `Permanently delete "${selectedEvent.title}"?`
                );


            if (!confirmed) {
                return;
            }


            const {
                error
            } =
                await supabaseClient
                    .from("events")
                    .delete()
                    .eq(
                        "id",
                        eventId
                    );


            if (error) {

                console.error(
                    "Delete event error:",
                    error
                );


                alert(
                    "Unable to delete event."
                );

                return;
            }


            await loadAdminEvents();
        }
    }
);


// ======================================================
// 21. CLOSE MODAL ON BACKGROUND CLICK
// ======================================================

eventEditorModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            eventEditorModal
        ) {

            closeEventModal();
        }
    }
);


// ======================================================
// 22. ESC KEY
// ======================================================

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {

            closeEventModal();
        }
    }
);


// ======================================================
// 23. LOGOUT
// ======================================================

logoutButton.addEventListener(
    "click",
    async () => {

        await supabaseClient
            .auth
            .signOut();


        window.location.href =
            "index.html";
    }
);


// ======================================================
// 24. YEAR
// ======================================================

const yearElement =
    document.getElementById(
        "admin-year"
    );


if (yearElement) {

    yearElement.textContent =
        new Date().getFullYear();
}


// ======================================================
// 25. START CMS
// ======================================================

async function startDashboard() {

    const user =
        await requireAdmin();


    if (!user) {
        return;
    }


    await Promise.all([
        loadAdminEvents(),
        loadSubscribers()
    ]);
}


startDashboard();