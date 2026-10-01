// ============================================
// PROTEÇÃO DA PÁGINA
// ============================================

const SESSION_KEY = "meuNegocioLoggedUser";

function readJsonStorage(storage, key, fallback = null) {
    try {
        const raw = storage.getItem(key);

        if (!raw) {
            return fallback;
        }

        return JSON.parse(raw);
    } catch (error) {
        console.warn(`Não foi possível ler "${key}".`, error);
        return fallback;
    }
}

function getLoggedUser() {
    const session = readJsonStorage(
        sessionStorage,
        SESSION_KEY,
        null
    );

    if (!session || typeof session !== "object") {
        return null;
    }

    const hasId =
        typeof session.id === "string" &&
        session.id.length > 0;

    const hasEmail =
        typeof session.email === "string" &&
        session.email.length > 0;

    const hasValidExpiry =
        Number.isFinite(Number(session.expiresAt)) &&
        Number(session.expiresAt) > Date.now();

    if (!hasId || !hasEmail || !hasValidExpiry) {
        sessionStorage.removeItem(SESSION_KEY);
        return null;
    }

    return {
        id: session.id,

        name:
            typeof session.name === "string"
                ? session.name.slice(0, 80)
                : "Usuário",

        email: session.email
    };
}

const loggedUser = getLoggedUser();

if (!loggedUser) {
    window.location.href = "login.html";
    throw new Error("Sessão inválida.");
}


// ============================================
// TRANSAÇÕES POR USUÁRIO
// ============================================

const TRANSACTIONS_KEY =
    `meuNegocioTransactions_${String(loggedUser.id)}`;


function readTransactions() {
    const stored = readJsonStorage(
        localStorage,
        TRANSACTIONS_KEY,
        []
    );

    if (!Array.isArray(stored)) {
        return [];
    }

    return stored
        .filter(transaction =>
            transaction &&
            typeof transaction === "object"
        )
        .map(normalizeTransaction)
        .filter(Boolean);
}


function normalizeTransaction(transaction) {

    const allowedTypes = new Set([
        "receita",
        "despesa"
    ]);

    const allowedStatuses = new Set([
        "pago",
        "pendente"
    ]);

    const allowedCategories = new Set([
        "Alimentação",
        "Transporte",
        "Moradia",
        "Saúde",
        "Educação",
        "Lazer"
    ]);


    const id =
        typeof transaction.id === "string" ||
        typeof transaction.id === "number"
            ? String(transaction.id)
            : null;


    const description =
        typeof transaction.description === "string"
            ? transaction.description
                .trim()
                .slice(0, 120)
            : "";


    const value = Number(transaction.value);


    const type =
        allowedTypes.has(transaction.type)
            ? transaction.type
            : null;


    const category =
        typeof transaction.category === "string" &&
        allowedCategories.has(transaction.category)
            ? transaction.category
            : null;


    const date =
        typeof transaction.date === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(transaction.date)
            ? transaction.date
            : null;


    const status =
        allowedStatuses.has(transaction.status)
            ? transaction.status
            : null;


    if (
        !id ||
        !description ||
        !Number.isFinite(value) ||
        value < 0 ||
        value > 999999999.99 ||
        !type ||
        !category ||
        !date ||
        !status
    ) {
        return null;
    }


    return {
        id,
        description,
        value,
        type,
        category,
        date,
        status
    };
}


let transactions = readTransactions();


// ============================================
// ELEMENTOS
// ============================================

const sections =
    document.querySelectorAll(".section");

const navItems =
    document.querySelectorAll(".nav-item");

const monthFilter =
    document.getElementById("monthFilter");

const modal =
    document.getElementById("transactionModal");


// ============================================
// FILTRO DE CATEGORIA
// ============================================

let activeCategoryFilter = null;


// ============================================
// USUÁRIO
// ============================================

function loadUser() {

    const name =
        loggedUser.name || "Usuário";


    document.getElementById("welcomeName")
        .textContent = name;


    document.getElementById("sidebarUserName")
        .textContent = name;


    document.getElementById("sidebarUserEmail")
        .textContent = loggedUser.email;


    document.getElementById("userAvatar")
        .textContent =
        name.charAt(0).toUpperCase();


    document.getElementById("settingsName")
        .value = name;
}


loadUser();


// ============================================
// NAVEGAÇÃO
// ============================================

navItems.forEach(button => {

    button.addEventListener("click", () => {

        const target =
            button.dataset.section;


        if (target === "lancamentos") {
            activeCategoryFilter = null;
        }


        showSection(target);

    });

});


document
    .querySelectorAll("[data-section-button]")
    .forEach(button => {

        button.addEventListener("click", () => {

            showSection(
                button.dataset.sectionButton
            );

        });

    });


function showSection(sectionName) {

    const allowedSections = new Set([
        "dashboard",
        "lancamentos",
        "categorias",
        "relatorios",
        "configuracoes"
    ]);


    if (!allowedSections.has(sectionName)) {
        return;
    }


    sections.forEach(section => {

        section.classList.remove("active");

    });


    navItems.forEach(item => {

        item.classList.remove("active");

    });


    const section =
        document.getElementById(sectionName);


    if (section) {
        section.classList.add("active");
    }


    const activeButton =
        document.querySelector(
            `[data-section="${CSS.escape(sectionName)}"]`
        );


    if (activeButton) {
        activeButton.classList.add("active");
    }

}


// ============================================
// LOGOUT
// ============================================

document
    .getElementById("logoutButton")
    .addEventListener("click", () => {

        sessionStorage.removeItem(SESSION_KEY);

        window.location.href =
            "login.html";

    });


// ============================================
// MODAL
// ============================================

document
    .getElementById("newTransactionButton")
    .addEventListener("click", openModal);


document
    .getElementById("newTransactionButton2")
    .addEventListener("click", openModal);


document
    .getElementById("closeModal")
    .addEventListener("click", closeModal);


function openModal() {

    modal.classList.add("show");


    document.getElementById("date").value =
        new Date()
            .toISOString()
            .split("T")[0];

}


function closeModal() {

    modal.classList.remove("show");

}


window.addEventListener("click", event => {

    if (event.target === modal) {
        closeModal();
    }

});


// ============================================
// NOVO LANÇAMENTO
// ============================================

document
    .getElementById("transactionForm")
    .addEventListener("submit", event => {

        event.preventDefault();


        const description =
            document
                .getElementById("description")
                .value
                .trim();


        const value =
            Number(
                document
                    .getElementById("value")
                    .value
            );


        const type =
            document
                .getElementById("type")
                .value;


        const category =
            document
                .getElementById("category")
                .value;


        const date =
            document
                .getElementById("date")
                .value;


        const status =
            document
                .getElementById("status")
                .value;


        // ========================================
        // VALIDAÇÃO
        // ========================================

        const allowedTypes = [
            "receita",
            "despesa"
        ];


        const allowedCategories = [
            "Alimentação",
            "Transporte",
            "Moradia",
            "Saúde",
            "Educação",
            "Lazer"
        ];


        const allowedStatuses = [
            "pago",
            "pendente"
        ];


        if (
            description.length < 1 ||
            description.length > 120
        ) {
            alert(
                "A descrição deve ter entre 1 e 120 caracteres."
            );
            return;
        }


        if (
            !Number.isFinite(value) ||
            value < 0 ||
            value > 999999999.99
        ) {
            alert("Informe um valor válido.");
            return;
        }


        if (!allowedTypes.includes(type)) {
            alert("Tipo de lançamento inválido.");
            return;
        }


        if (!allowedCategories.includes(category)) {
            alert("Categoria inválida.");
            return;
        }


        if (!allowedStatuses.includes(status)) {
            alert("Status inválido.");
            return;
        }


        if (
            !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
            Number.isNaN(
                new Date(date + "T00:00:00").getTime()
            )
        ) {
            alert("Data inválida.");
            return;
        }


        // ========================================
        // ID
        // ========================================

        const id =
            typeof crypto !== "undefined" &&
            typeof crypto.randomUUID === "function"
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2)}`;


        const transaction = {

            id,

            description,

            value,

            type,

            category,

            date,

            status

        };


        transactions.push(transaction);


        saveTransactions();


        event.target.reset();

        closeModal();

        updateDashboard();

    });


// ============================================
// LOCAL STORAGE
// ============================================

function saveTransactions() {

    localStorage.setItem(
        TRANSACTIONS_KEY,
        JSON.stringify(transactions)
    );

}

// ============================================
// MESES
// ============================================

function getMonthKey(date) {

    const d =
        new Date(date + "T00:00:00");

    if (Number.isNaN(d.getTime())) {
        return null;
    }

    return `${d.getFullYear()}-${String(
        d.getMonth() + 1
    ).padStart(2, "0")}`;

}


function getCurrentMonth() {

    const date =
        new Date();

    return `${date.getFullYear()}-${String(
        date.getMonth() + 1
    ).padStart(2, "0")}`;

}


function getPreviousMonth(monthKey) {

    const parts =
        monthKey.split("-").map(Number);

    if (
        parts.length !== 2 ||
        !Number.isInteger(parts[0]) ||
        !Number.isInteger(parts[1])
    ) {
        return getCurrentMonth();
    }


    const [year, month] = parts;


    const date =
        new Date(
            year,
            month - 2,
            1
        );


    return `${date.getFullYear()}-${String(
        date.getMonth() + 1
    ).padStart(2, "0")}`;

}


// ============================================
// FILTRO DE MÊS
// ============================================

function loadMonthFilter() {

    const currentSelected =
        monthFilter.value;


    const months =
        new Set();


    months.add(
        getCurrentMonth()
    );


    transactions.forEach(transaction => {

        const month =
            getMonthKey(transaction.date);


        if (month) {
            months.add(month);
        }

    });


    monthFilter.innerHTML = "";


    [...months]
        .sort()
        .reverse()
        .forEach(month => {

            const option =
                document.createElement(
                    "option"
                );


            option.value = month;


            const [
                year,
                monthNumber
            ] =
                month.split("-");


            const date =
                new Date(
                    Number(year),
                    Number(monthNumber) - 1
                );


            option.textContent =
                date.toLocaleDateString(
                    "pt-BR",
                    {
                        month: "long",
                        year: "numeric"
                    }
                );


            monthFilter.appendChild(
                option
            );

        });


    if (
        currentSelected &&
        months.has(currentSelected)
    ) {

        monthFilter.value =
            currentSelected;

    } else {

        monthFilter.value =
            getCurrentMonth();

    }

}


monthFilter.addEventListener(
    "change",
    updateDashboard
);


// ============================================
// DADOS DO MÊS
// ============================================

function getMonthData(monthKey) {

    const monthTransactions =
        transactions.filter(
            transaction =>
                getMonthKey(
                    transaction.date
                ) === monthKey
        );


    const income =
        monthTransactions
            .filter(
                transaction =>
                    transaction.type === "receita"
            )
            .reduce(
                (total, transaction) =>
                    total + transaction.value,
                0
            );


    const expense =
        monthTransactions
            .filter(
                transaction =>
                    transaction.type === "despesa"
            )
            .reduce(
                (total, transaction) =>
                    total + transaction.value,
                0
            );


    const pending =
        monthTransactions
            .filter(
                transaction =>
                    transaction.status === "pendente"
            )
            .length;


    return {

        transactions:
            monthTransactions,

        income,

        expense,

        balance:
            income - expense,

        pending

    };

}


// ============================================
// COMPARAÇÃO
// ============================================

function calculateComparison(
    current,
    previous
) {

    if (
        !Number.isFinite(current) ||
        !Number.isFinite(previous)
    ) {
        return "Sem alteração";
    }


    if (previous === 0) {

        if (current === 0) {
            return "Sem alteração";
        }

        return "Novo neste mês";

    }


    const percentage =
        (
            (current - previous) /
            Math.abs(previous)
        ) * 100;


    const symbol =
        percentage >= 0
            ? "↑"
            : "↓";


    return `${symbol} ${Math.abs(
        percentage
    ).toFixed(1)}% vs mês anterior`;

}


// ============================================
// DASHBOARD
// ============================================

function updateDashboard() {

    const selectedBefore =
        monthFilter.value;


    loadMonthFilter();


    if (
        selectedBefore &&
        [...monthFilter.options]
            .some(
                option =>
                    option.value ===
                    selectedBefore
            )
    ) {

        monthFilter.value =
            selectedBefore;

    }


    const selectedMonth =
        monthFilter.value ||
        getCurrentMonth();


    const previousMonth =
        getPreviousMonth(
            selectedMonth
        );


    const current =
        getMonthData(
            selectedMonth
        );


    const previous =
        getMonthData(
            previousMonth
        );


    // ========================================
    // CARDS
    // ========================================

    document
        .getElementById("totalIncome")
        .textContent =
        formatMoney(
            current.income
        );


    document
        .getElementById("totalExpense")
        .textContent =
        formatMoney(
            current.expense
        );


    document
        .getElementById("totalBalance")
        .textContent =
        formatMoney(
            current.balance
        );


    document
        .getElementById("pendingCount")
        .textContent =
        String(current.pending);


    // ========================================
    // COMPARAÇÕES
    // ========================================

    document
        .getElementById(
            "incomeComparison"
        )
        .textContent =
        calculateComparison(
            current.income,
            previous.income
        );


    document
        .getElementById(
            "expenseComparison"
        )
        .textContent =
        calculateComparison(
            current.expense,
            previous.expense
        );


    document
        .getElementById(
            "balanceComparison"
        )
        .textContent =
        calculateComparison(
            current.balance,
            previous.balance
        );


    // ========================================
    // TRANSAÇÕES
    // ========================================

    renderTransactions(
        current.transactions
    );


    renderRecentTransactions(
        current.transactions
    );


    // ========================================
    // GRÁFICOS
    // ========================================

    updateCharts(
        current,
        previous
    );


    // ========================================
    // RELATÓRIO
    // ========================================

    updateReport(
        current,
        previous
    );


    // ========================================
    // LISTA GERAL
    // ========================================

    renderAllTransactions();

}


// ============================================
// FORMATAÇÃO
// ============================================

function formatMoney(value) {

    const safeValue =
        Number.isFinite(Number(value))
            ? Number(value)
            : 0;


    return safeValue.toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

}


// ============================================
// ELEMENTO VAZIO SEGURO
// ============================================

function createEmptyMessage(message) {

    const empty =
        document.createElement("div");


    empty.className = "empty";


    empty.textContent = message;


    return empty;
}


// ============================================
// TRANSAÇÕES DO DASHBOARD
// ============================================

function renderTransactions(list) {

    const container =
        document.getElementById(
            "transactionsList"
        );


    if (!container) {
        return;
    }


    container.replaceChildren();


    if (!list.length) {

        container.appendChild(
            createEmptyMessage(
                "Nenhum lançamento encontrado."
            )
        );

        return;
    }


    list
        .slice()
        .reverse()
        .forEach(transaction => {

            container.appendChild(
                createTransactionElement(
                    transaction
                )
            );

        });

}


// ============================================
// TODAS AS TRANSAÇÕES
// ============================================

function renderAllTransactions() {

    const search =
        document
            .getElementById(
                "searchInput"
            )
            .value
            .trim()
            .toLowerCase();


    const type =
        document
            .getElementById(
                "typeFilter"
            )
            .value;


    const status =
        document
            .getElementById(
                "statusFilter"
            )
            .value;


    let filtered =
        transactions.filter(
            transaction => {

                const description =
                    typeof transaction.description === "string"
                        ? transaction.description.toLowerCase()
                        : "";


                const matchesSearch =
                    description.includes(search);


                const matchesType =
                    type === "all" ||
                    transaction.type === type;


                const matchesStatus =
                    status === "all" ||
                    transaction.status === status;


                const matchesCategory =
                    !activeCategoryFilter ||
                    transaction.category ===
                        activeCategoryFilter;


                return (
                    matchesSearch &&
                    matchesType &&
                    matchesStatus &&
                    matchesCategory
                );

            }
        );


    const container =
        document.getElementById(
            "transactionsList"
        );


    if (!container) {
        return;
    }


    container.replaceChildren();


    if (!filtered.length) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className = "empty";


        if (activeCategoryFilter) {

            empty.appendChild(
                document.createTextNode(
                    "Nenhum lançamento encontrado na categoria "
                )
            );


            const strong =
                document.createElement(
                    "strong"
                );


            strong.textContent =
                activeCategoryFilter;


            empty.appendChild(strong);


            empty.appendChild(
                document.createTextNode(".")
            );

        } else {

            empty.textContent =
                "Nenhum lançamento encontrado.";

        }


        container.appendChild(empty);

        return;
    }


    filtered
        .slice()
        .reverse()
        .forEach(transaction => {

            container.appendChild(
                createTransactionElement(
                    transaction
                )
            );

        });

}


// ============================================
// ELEMENTO DE TRANSAÇÃO
// ============================================

function createTransactionElement(
    transaction
) {

    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "transaction";


    // ----------------------------------------
    // LADO ESQUERDO
    // ----------------------------------------

    const left =
        document.createElement(
            "div"
        );


    left.className =
        "transaction-left";


    const icon =
        document.createElement(
            "div"
        );


    icon.className =
        `transaction-icon ${transaction.type}`;


    icon.textContent =
        transaction.type === "receita"
            ? "↑"
            : "↓";


    const info =
        document.createElement(
            "div"
        );


    info.className =
        "transaction-info";


    const description =
        document.createElement(
            "strong"
        );


    // IMPORTANTE:
    // textContent impede HTML/JS injetado
    // na descrição.

    description.textContent =
        transaction.description;


    const details =
        document.createElement(
            "span"
        );


    const date =
        new Date(
            transaction.date +
            "T00:00:00"
        );


    const formattedDate =
        Number.isNaN(date.getTime())
            ? "Data inválida"
            : date.toLocaleDateString(
                "pt-BR"
            );


    // Também usamos textContent aqui.
    details.textContent =
        `${transaction.category} • ${formattedDate} • ${transaction.status}`;


    info.appendChild(description);
    info.appendChild(details);


    left.appendChild(icon);
    left.appendChild(info);


    // ----------------------------------------
    // LADO DIREITO
    // ----------------------------------------

    const right =
        document.createElement(
            "div"
        );


    const value =
        document.createElement(
            "span"
        );


    value.className =
        `transaction-value ${transaction.type}`;


    const sign =
        transaction.type === "receita"
            ? "+"
            : "-";


    value.textContent =
        `${sign}${formatMoney(transaction.value)}`;


    const deleteButton =
        document.createElement(
            "button"
        );


    deleteButton.type = "button";


    deleteButton.className =
        "delete-button";


    deleteButton.setAttribute(
        "aria-label",
        "Excluir lançamento"
    );


    deleteButton.textContent = "×";


    // NÃO usamos onclick="..."
    // Isso elimina código JS inline
    // e evita misturar dados no HTML.

    deleteButton.addEventListener(
        "click",
        () => {

            deleteTransaction(
                transaction.id
            );

        }
    );


    right.appendChild(value);
    right.appendChild(deleteButton);


    wrapper.appendChild(left);
    wrapper.appendChild(right);


    return wrapper;

}


// ============================================
// TRANSAÇÕES RECENTES
// ============================================

function renderRecentTransactions(
    list
) {

    const container =
        document.getElementById(
            "recentTransactions"
        );


    if (!container) {
        return;
    }


    container.replaceChildren();


    const recent =
        list
            .slice()
            .sort(
                (a, b) =>
                    new Date(
                        b.date
                    ) -
                    new Date(
                        a.date
                    )
            )
            .slice(0, 5);


    if (!recent.length) {

        container.appendChild(
            createEmptyMessage(
                "Ainda não existem movimentações."
            )
        );

        return;
    }


    recent.forEach(transaction => {

        container.appendChild(
            createTransactionElement(
                transaction
            )
        );

    });

}


// ============================================
// EXCLUIR
// ============================================

function deleteTransaction(id) {

    if (
        typeof id !== "string" &&
        typeof id !== "number"
    ) {
        return;
    }


    const confirmed =
        confirm(
            "Deseja excluir este lançamento?"
        );


    if (!confirmed) {
        return;
    }


    const normalizedId =
        String(id);


    transactions =
        transactions.filter(
            transaction =>
                String(transaction.id) !==
                normalizedId
        );


    saveTransactions();


    updateDashboard();

}


// ============================================
// FILTROS
// ============================================

document
    .getElementById("searchInput")
    .addEventListener(
        "input",
        renderAllTransactions
    );


document
    .getElementById("typeFilter")
    .addEventListener(
        "change",
        renderAllTransactions
    );


document
    .getElementById("statusFilter")
    .addEventListener(
        "change",
        renderAllTransactions
    );


// ============================================
// CATEGORIAS
// ============================================

document
    .querySelectorAll(".category-box")
    .forEach(card => {

        card.addEventListener(
            "click",
            () => {

                const strong =
                    card.querySelector(
                        "strong"
                    );


                if (!strong) {
                    return;
                }


                const category =
                    strong
                        .textContent
                        .trim();


                if (!category) {
                    return;
                }


                activeCategoryFilter =
                    category;


                showSection(
                    "lancamentos"
                );


                document
                    .getElementById(
                        "searchInput"
                    )
                    .value = "";


                document
                    .getElementById(
                        "typeFilter"
                    )
                    .value = "all";


                document
                    .getElementById(
                        "statusFilter"
                    )
                    .value = "all";


                renderAllTransactions();

            }
        );

    });


// ============================================
// BOTÃO "VER TODAS"
// ============================================

document
    .querySelectorAll(
        '[data-section-button="lancamentos"]'
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                activeCategoryFilter =
                    null;


                showSection(
                    "lancamentos"
                );


                renderAllTransactions();

            }
        );

    });
    // ============================================
// GRÁFICOS
// ============================================

let financialChart = null;
let categoryChart = null;


function updateCharts(
    current,
    previous
) {

    const financial =
        document.getElementById(
            "financialChart"
        );


    if (!financial) {
        return;
    }


    // ----------------------------------------
    // GRÁFICO FINANCEIRO
    // ----------------------------------------

    if (
        typeof Chart === "undefined"
    ) {
        console.warn(
            "Chart.js não foi carregado."
        );

        return;
    }


    if (financialChart) {
        financialChart.destroy();
        financialChart = null;
    }


    const ctx =
        financial.getContext("2d");


    if (!ctx) {
        return;
    }


    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            300
        );


    gradient.addColorStop(
        0,
        "rgba(64, 98, 255, .25)"
    );


    gradient.addColorStop(
        1,
        "rgba(64, 98, 255, 0)"
    );


    financialChart =
        new Chart(
            ctx,
            {

                type: "line",

                data: {

                    labels: [
                        "Mês anterior",
                        "Mês atual"
                    ],

                    datasets: [

                        {

                            label:
                                "Receitas",

                            data: [
                                previous.income,
                                current.income
                            ],

                            borderColor:
                                "#4062ff",

                            backgroundColor:
                                gradient,

                            fill: true,

                            tension: .4,

                            borderWidth: 3,

                            pointRadius: 5,

                            pointBackgroundColor:
                                "#ffffff",

                            pointBorderColor:
                                "#4062ff",

                            pointBorderWidth:
                                3

                        },


                        {

                            label:
                                "Despesas",

                            data: [
                                previous.expense,
                                current.expense
                            ],

                            borderColor:
                                "#ff5c6c",

                            backgroundColor:
                                "transparent",

                            tension: .4,

                            borderWidth: 3,

                            pointRadius: 5

                        }

                    ]

                },


                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    plugins: {

                        legend: {
                            display: true
                        }

                    },

                    scales: {

                        y: {

                            beginAtZero:
                                true,

                            grid: {

                                color:
                                    "#edf1f6"

                            }

                        },

                        x: {

                            grid: {

                                display:
                                    false

                            }

                        }

                    }

                }

            }
        );


    // ========================================
    // GRÁFICO DE CATEGORIAS
    // ========================================

    const categoryValues = {};


    current.transactions

        .filter(
            transaction =>
                transaction.type ===
                "despesa"
        )

        .forEach(
            transaction => {

                const category =
                    transaction.category;


                if (
                    typeof category !==
                    "string"
                ) {
                    return;
                }


                if (
                    !Number.isFinite(
                        transaction.value
                    )
                ) {
                    return;
                }


                categoryValues[
                    category
                ] =
                    (
                        categoryValues[
                            category
                        ] || 0
                    ) +
                    transaction.value;

            }
        );


    const categoryLabels =
        Object.keys(
            categoryValues
        );


    const categoryData =
        Object.values(
            categoryValues
        );


    const categoryCanvas =
        document.getElementById(
            "categoryChart"
        );


    if (!categoryCanvas) {
        return;
    }


    if (categoryChart) {
        categoryChart.destroy();
        categoryChart = null;
    }


    const categoryContext =
        categoryCanvas.getContext(
            "2d"
        );


    if (!categoryContext) {
        return;
    }


    categoryChart =
        new Chart(
            categoryContext,
            {

                type: "doughnut",

                data: {

                    labels:
                        categoryLabels,

                    datasets: [

                        {

                            data:
                                categoryData,

                            backgroundColor: [

                                "#4062ff",
                                "#40baff",
                                "#20bf6b",
                                "#ff4757",
                                "#f5a623",
                                "#9b59b6"

                            ],

                            borderWidth:
                                0

                        }

                    ]

                },


                options: {

                    responsive:
                        true,

                    plugins: {

                        legend: {

                            position:
                                "bottom"

                        }

                    }

                }

            }
        );

}


// ============================================
// RELATÓRIO
// ============================================

function updateReport(
    current,
    previous
) {

    const reportCurrent =
        document.getElementById(
            "reportCurrent"
        );


    const reportPrevious =
        document.getElementById(
            "reportPrevious"
        );


    const reportDifference =
        document.getElementById(
            "reportDifference"
        );


    if (reportCurrent) {

        reportCurrent.textContent =
            formatMoney(
                current.balance
            );

    }


    if (reportPrevious) {

        reportPrevious.textContent =
            formatMoney(
                previous.balance
            );

    }


    if (reportDifference) {

        reportDifference.textContent =
            formatMoney(
                current.balance -
                previous.balance
            );

    }

}


// ============================================
// CONFIGURAÇÕES
// ============================================

document
    .getElementById("saveSettings")
    .addEventListener(
        "click",
        () => {

            const input =
                document.getElementById(
                    "settingsName"
                );


            if (!input) {
                return;
            }


            const newName =
                input.value
                    .trim();


            // =================================
            // VALIDAÇÃO DO NOME
            // =================================

            if (
                newName.length < 2 ||
                newName.length > 80
            ) {

                alert(
                    "O nome deve ter entre 2 e 80 caracteres."
                );

                return;
            }


            // =================================
            // ATUALIZA SESSÃO
            // =================================

            loggedUser.name =
                newName;


            const currentSession =
                readJsonStorage(
                    sessionStorage,
                    SESSION_KEY,
                    null
                );


            if (
                !currentSession ||
                typeof currentSession !==
                    "object"
            ) {

                sessionStorage.removeItem(
                    SESSION_KEY
                );

                window.location.href =
                    "login.html";

                return;
            }


            currentSession.name =
                newName;


            sessionStorage.setItem(
                SESSION_KEY,
                JSON.stringify(
                    currentSession
                )
            );


            loadUser();


            alert(
                "Configurações salvas!"
            );

        }
    );


// ============================================
// INICIALIZAÇÃO
// ============================================

loadMonthFilter();

updateDashboard();