// ======================================================
// FUGLYMAMMIE CMS DASHBOARD
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


let adminEvents = [];
let subscribers = [];


// ======================================================
// ELEMENTS
// ======================================================

const logoutButton =
    document.getElementById(
        "logout-button"
    );

const adminEventsList =
    document.getElementById(
        "admin-events-list"
    );

const subscriberList =
    document.getElementById(
        "subscriber-list"
    );

const totalEventsElement =
    document.getElementById(
        "total-events"
    );

const upcomingEventsCountElement =
    document.getElementById(
        "upcoming-events-count"
    );

const subscriberCountElement =
    document.getElementById(
        "subscriber-count"
    );

const addEventButton =
    document.getElementById(
        "add-event-button"
    );

const overviewAddEventButton =
    document.getElementById(
        "overview-add-event"
    );

const eventEditorModal =
    document.getElementById(
        "event-editor-modal"
    );

const closeEventEditorButton =
    document.getElementById(
        "close-event-editor"
    );

const eventForm =
    document.getElementById(
        "event-form"
    );

const eventFormHeading =
    document.getElementById(
        "event-form-heading"
    );

const eventFormMessage =
    document.getElementById(
        "event-form-message"
    );

const saveEventButton =
    document.getElementById(
        "save-event-button"
    );


// ======================================================
// HELPERS
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


function formatDateTime(dateString) {

    if (!dateString) {
        return "";
    }

    return new Date(
        dateString
    ).toLocaleString(
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
// REQUIRE ADMIN
// ======================================================

async function requireAdmin() {

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

            // /admin/dashboard/ -> /admin/
            window.location.href =
                "../";

            return null;
        }


        const {
            data: admin,
            error: adminError
        } =
            await supabaseClient
                .from("admins")
                .select(
                    "user_id, email"
                )
                .eq(
                    "user_id",
                    data.session.user.id
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
                "../";

            return null;
        }


        return data.session.user;


    } catch (error) {

        console.error(
            "Admin check failed:",
            error
        );


        window.location.href =
            "../";

        return null;
    }
}


// ======================================================
// LOAD EVENTS
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
            .select("*")
            .order(
                "event_date",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Events error:",
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

    updateStats();
}


// ======================================================
// LOAD SUBSCRIBERS
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
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Subscribers error:",
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

    updateStats();
}


// ======================================================
// STATS
// ======================================================

function updateStats() {

    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );


    const upcoming =
        adminEvents.filter(
            event => {

                if (
                    event.status !==
                    "upcoming"
                ) {
                    return false;
                }


                const eventDate =
                    new Date(
                        `${event.event_date}T00:00:00`
                    );


                return eventDate >= today;
            }
        );


    totalEventsElement.textContent =
        adminEvents.length;

    upcomingEventsCountElement.textContent =
        upcoming.length;

    subscriberCountElement.textContent =
        subscribers.length;
}


// ======================================================
// RENDER EVENTS
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
        adminEvents.map(
            event => {

                const publishState =
                    event.published
                        ? "Published"
                        : "Hidden";


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

                                ${escapeHTML(
                                    event.location ||
                                    "No location"
                                )}

                                ·

                                ${escapeHTML(
                                    event.status
                                )}

                                ·

                                ${publishState}

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
                                ${
                                    event.status ===
                                    "postponed"
                                        ? "Set Upcoming"
                                        : "Postpone"
                                }
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
            }
        ).join("");
}


// ======================================================
// RENDER SUBSCRIBERS
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
        subscribers.map(
            subscriber => {

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

                                ${escapeHTML(
                                    subscriber.city ||
                                    "No city"
                                )}

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
            }
        ).join("");
}


// ======================================================
// DASHBOARD NAVIGATION
// ======================================================

document
    .querySelectorAll(
        ".dashboard-nav-button"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".dashboard-nav-button"
                        )
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "active"
                                )
                        );


                    button.classList.add(
                        "active"
                    );


                    document
                        .querySelectorAll(
                            ".dashboard-section"
                        )
                        .forEach(
                            section =>
                                section.classList.remove(
                                    "active"
                                )
                        );


                    const target =
                        document.getElementById(
                            `${button.dataset.section}-section`
                        );


                    if (target) {
                        target.classList.add(
                            "active"
                        );
                    }
                }
            );
        }
    );


// ======================================================
// ADD EVENT
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
// EDIT EVENT
// ======================================================

function openEditEventModal(
    eventId
) {

    const selected =
        adminEvents.find(
            event =>
                event.id === eventId
        );


    if (!selected) {
        return;
    }


    document.getElementById(
        "event-id"
    ).value =
        selected.id;


    document.getElementById(
        "event-title"
    ).value =
        selected.title || "";


    document.getElementById(
        "event-date"
    ).value =
        selected.event_date || "";


    document.getElementById(
        "event-location"
    ).value =
        selected.location || "";


    document.getElementById(
        "event-description"
    ).value =
        selected.description || "";


    document.getElementById(
        "event-ticket-url"
    ).value =
        selected.ticket_url || "";


    document.getElementById(
        "event-status"
    ).value =
        selected.status || "upcoming";


    document.getElementById(
        "event-published"
    ).checked =
        !!selected.published;


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
// CLOSE MODAL
// ======================================================

function closeEventModal() {

    eventEditorModal.classList.remove(
        "active"
    );
}


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
// SAVE EVENT
// ======================================================

eventForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const id =
            document.getElementById(
                "event-id"
            ).value;


        const title =
            document.getElementById(
                "event-title"
            ).value.trim();


        const eventDate =
            document.getElementById(
                "event-date"
            ).value;


        const location =
            document.getElementById(
                "event-location"
            ).value.trim();


        const description =
            document.getElementById(
                "event-description"
            ).value.trim();


        const ticketUrl =
            document.getElementById(
                "event-ticket-url"
            ).value.trim();


        const status =
            document.getElementById(
                "event-status"
            ).value;


        let published =
            document.getElementById(
                "event-published"
            ).checked;


        if (status === "draft") {
            published = false;
        }


        if (!title || !eventDate) {

            eventFormMessage.textContent =
                "Title and date are required.";

            return;
        }


        const payload = {

            title,

            event_date:
                eventDate,

            location:
                location || null,

            description:
                description || null,

            ticket_url:
                ticketUrl || null,

            status,

            published,

            updated_at:
                new Date().toISOString()
        };


        saveEventButton.disabled =
            true;


        saveEventButton.textContent =
            "Saving...";


        try {

            let result;


            if (id) {

                result =
                    await supabaseClient
                        .from("events")
                        .update(payload)
                        .eq(
                            "id",
                            id
                        );

            } else {

                result =
                    await supabaseClient
                        .from("events")
                        .insert([
                            payload
                        ]);
            }


            if (result.error) {
                throw result.error;
            }


            eventFormMessage.textContent =
                id
                    ? "Event updated."
                    : "Event created.";


            await loadAdminEvents();


            setTimeout(
                closeEventModal,
                500
            );


        } catch (error) {

            console.error(
                "Save error:",
                error
            );


            eventFormMessage.textContent =
                error.message ||
                "Unable to save event.";


        } finally {

            saveEventButton.disabled =
                false;


            saveEventButton.textContent =
                id
                    ? "Save Changes"
                    : "Publish Event";
        }
    }
);


// ======================================================
// QUICK UPDATE
// ======================================================

async function updateEvent(
    id,
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
                id
            );


    if (error) {

        alert(
            error.message ||
            "Unable to update event."
        );

        return;
    }


    await loadAdminEvents();
}


// ======================================================
// EVENT ACTIONS
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


        const id =
            button.dataset.id;

        const action =
            button.dataset.action;


        const selected =
            adminEvents.find(
                item =>
                    item.id === id
            );


        if (!selected) {
            return;
        }


        if (action === "edit") {

            openEditEventModal(
                id
            );

            return;
        }


        if (action === "postpone") {

            await updateEvent(
                id,
                {
                    status:
                        selected.status ===
                        "postponed"
                            ? "upcoming"
                            : "postponed"
                }
            );

            return;
        }


        if (action === "cancel") {

            if (
                !confirm(
                    `Cancel "${selected.title}"?`
                )
            ) {
                return;
            }


            await updateEvent(
                id,
                {
                    status:
                        "cancelled"
                }
            );

            return;
        }


        if (action === "publish") {

            let status =
                selected.status;


            if (
                !selected.published &&
                status === "draft"
            ) {
                status =
                    "upcoming";
            }


            await updateEvent(
                id,
                {
                    published:
                        !selected.published,

                    status
                }
            );

            return;
        }


        if (action === "delete") {

            if (
                !confirm(
                    `Permanently delete "${selected.title}"?`
                )
            ) {
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
                        id
                    );


            if (error) {

                alert(
                    error.message ||
                    "Unable to delete event."
                );

                return;
            }


            await loadAdminEvents();
        }
    }
);


// ======================================================
// MODAL BACKGROUND / ESC
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


document.addEventListener(
    "keydown",
    event => {

        if (event.key === "Escape") {
            closeEventModal();
        }
    }
);


// ======================================================
// LOGOUT
// ======================================================

logoutButton.addEventListener(
    "click",
    async () => {

        await supabaseClient
            .auth
            .signOut();


        // /admin/dashboard/ -> /admin/
        window.location.href =
            "../";
    }
);


// ======================================================
// YEAR
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
// START
// ======================================================

async function startDashboard() {

    const admin =
        await requireAdmin();


    if (!admin) {
        return;
    }


    await Promise.all([
        loadAdminEvents(),
        loadSubscribers()
    ]);
}


startDashboard();