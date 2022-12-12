const endpoint = "https://oauth2.googleapis.com/token";
const drive_end = 'https://www.googleapis.com/drive/v3/files';
const sheets_end = 'https://sheets.googleapis.com/v4/spreadsheets';
const docs_end = 'https://docs.googleapis.com/v1/documents'
const client_id = '167979643861-c206l9c0vhor77mgveujailnleklgiad.apps.googleusercontent.com';
const client_secret = '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';
const scope = 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive ' +
    'openid profile email';
const discovery_docs = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const redirect_uri = "localhost:8000"
const quotations = '1VkcwZo_-E10aDjmeRBr91V0htphc__eE';
let profile = {};
let currentSheet;
let timerID;
let webgl;

function setupLogin() {
    if (window.location.href.split('?')[1] === undefined) {
        document.getElementById("loginButton").style.display = "flex";
        document.getElementById("googleImage").setAttribute("class", "spin");
    }

    const array = window.location.href.split('?')[1]?.split('&')[0]?.split('=');
    if (array != null && array[0] === "code" && array[1] !== null) {
        document.getElementById("loginButton").style.display = "none";
        document.getElementById("loading").style.display = "flex";
        fetch(endpoint + "?grant_type=authorization_code&client_id=" +
            client_id + "&client_secret=" + client_secret + "&redirect_uri=http%3A//" +
            redirect_uri + "&code=" + array[1], {
            method: 'POST', headers: { 'Accept': 'application/x-www-form-urlencoded' },
        }).then(response => response.json()).then(json => {
            profile.access_token = json.access_token;
            profile.id_token = json.id_token;
            profile.refresh_token = json.refresh_token;
            profile.expires_in = json.expires_in * 1000;
            profile.save_time = new Date().getTime();
            fetch(endpoint + "info?id_token=" + json.id_token, {
                method: 'POST', headers: { 'Accept': 'application/x-www-form-urlencoded' }
            }).then(response => response.json()).then(json => {
                profile.email = json.email;
                profile.sub = json.sub;
                profile.name = json.given_name;
                profile.picture = json.picture;
                fetch(docs_end + '/1Qvc-kCvvJOfr60aF_OwVzi71QtEu6rNeLY-KubeaTHQ', makeRequest('GET')
                ).then(response => {
                    if (response.ok)
                        response.json().then(json => {
                            profile.apiKey = json.body.content[1].paragraph.elements[0].textRun.content;
                            localStorage.profile = JSON.stringify(profile);
                            setupDashboard();
                        });
                    else {
                        alert("This Account is not Allowed to login");
                        document.getElementById("loginButton").style.display = "flex";
                        document.getElementById("googleImage").setAttribute("class", "spin");
                    }
                });
            });
        });
    }
}

async function setupDashboard() {
    const startTime = new Date().getTime();
    profile = JSON.parse(localStorage.profile);
    document.getElementById("login").style.display = 'none';
    document.getElementById("loading").style.display = 'none';
    document.getElementById("application").style.display = "flex";
    document.getElementById("dashboard").style.display = 'flex';
    document.getElementById('header').children[0].className = 'active';
    if (await checkToken()) {
        document.getElementById("userName").innerHTML = 'Logout ' + profile.name;
        document.getElementById("userPicture").src = profile.picture;
        createFile(new Date().getFullYear(), 'application/vnd.google-apps.folder');
        currentSheet = await createFile(new Date().toLocaleDateString('en-GB', { month: 'long' }));
        setupTables();
        //setupFiles();
    }
    console.log((new Date().getTime() - startTime) / 60);
}

function login() {
    window.location = "https://accounts.google.com/o/oauth2/v2/auth?" +
        "response_type=code&include_granted_scopes=true&access_type=offline&" +
        "client_id=" + client_id + "&redirect_uri=http%3A//" + redirect_uri + "&" +
        "scope=https%3A%2F%2Fwww.googleapis.com/auth/drive%20openid%20profile%20email%20" +
        "https%3A%2F%2Fwww.googleapis.com/auth/spreadsheets&login_hint=rockshowholdings";
}

function logout() {
    localStorage.removeItem("profile");
    profile = {};
    document.getElementById("login").style.display = "flex";
    document.getElementById("application").style.display = "none";
    document.getElementById("loginButton").style.display = "flex";
    document.getElementById("googleImage").setAttribute("class", "spin");
}

function setupNewSheet(sheetID) {
    updateSheet(sheetID, [{
        updateSpreadsheetProperties: {
            properties: {
                title: new Date().toLocaleDateString('en-GB', { month: 'long' }),
            },
            fields: 'title'
        }
    }, {
        updateSheetProperties: {
            properties: {
                title: 'Customers',
                gridProperties: { rowCount: 1, columnCount: 9 }
            },
            fields: 'title,gridProperties.rowCount,gridProperties.columnCount'
        },
    }, {
        updateCells: {
            rows: [{
                values: [
                    { userEnteredValue: { stringValue: 'ID' } },
                    { userEnteredValue: { stringValue: 'Name' } },
                    { userEnteredValue: { stringValue: 'Surname' } },
                    { userEnteredValue: { stringValue: 'Phone Number' } },
                    { userEnteredValue: { stringValue: 'Whatsapp' } },
                    { userEnteredValue: { stringValue: 'Email' } },
                    { userEnteredValue: { stringValue: 'Location' } },
                    { userEnteredValue: { stringValue: 'Date' } },
                    { userEnteredValue: { stringValue: 'Done' } },
                ]
            }],
            fields: 'userEnteredValue',
            range: { sheetId: 0 }
        }
    }]);
}

async function getSheetInformation(id = currentSheet) {
    const request = await fetch(sheets_end + '/' + id, makeRequest('GET'));
    const data = await request.json();
    const properties = data.properties;
    const sheets = data.sheets
    return { properties, sheets };
}

async function checkToken() {
    let status;
    if (new Date().getTime() - profile.save_time >= profile.expires_in)
        status = await fetch(endpoint + '?grant_type=refresh_token&client_id=' + client_id +
            '&client_secret=' + client_secret + '&refresh_token=' + profile.refresh_token,
            makeRequest('POST')).then(response => response.json()).then(json => {
                profile.access_token = json.access_token;
                profile.id_token = json.id_token;
                profile.expires_in = json.expires_in * 1000;
                profile.save_time = new Date().getTime();
                localStorage.profile = JSON.stringify(profile);
                return true;
            });
    else status = true;
    if (timerID) clearTimeout(timerID);
    const timeout = profile.expires_in - new Date().getTime() + profile.save_time;
    timerID = setTimeout(checkToken, timeout);
    return status;
}

async function createFile(name, type = 'application/vnd.google-apps.spreadsheet') {
    let parent = quotations
    let id = '0';
    if (name !== new Date().getFullYear()) {
        const request = await fetch(drive_end + '?q=%27' + quotations +
            '%27 in parents and name = %27' + new Date().getFullYear() +
            '%27', makeRequest('GET'));
        const list = await request.json();
        parent = list.files[0].id;
    }
    if (!await fileExists('mimeType = %27' + type + '%27 and name = %27' + name + '%27',
        parent)) {
        const request = await fetch(drive_end, makeRequest('POST', {
            'name': name, 'mimeType': type, 'parents': [parent],
        }));
        const list = await request.json();
        id = list.id;
        if (name === new Date().toLocaleDateString('en-GB', { month: 'long' }))
            setupNewSheet(list.id);
    }
    if (name === new Date().toLocaleDateString('en-GB', { month: 'long' })) {
        id = await getFileID('mimeType = %27' + type + '%27 and name = %27' +
            name + '%27', parent)
    }
    return id;
}

async function fileExists(filter, parent) {
    const request = await fetch(drive_end + '?q=%27' + parent +
        '%27 in parents and' + filter, makeRequest('GET'));
    const list = await request.json();
    return list.files.length >= 1;
}

function listFiles() {
    fetch('https://www.googleapis.com/drive/v3/files?q=%27' + quotations +
        '%27 in parents and mimeType = %27application%2Fvnd.google-apps.spreadsheet%27',
        makeRequest('GET')
    ).then(response => response.json()).then(json => {
        console.log(json);
        json.files.forEach(function (file) {
            console.log(file.name + " " + file.id);
        });
    });
}

function updateSheet(id = currentSheet, requests) {
    fetch(sheets_end + '/' + id + '/:batchUpdate',
        makeRequest('POST', {
            'requests': requests,
        })
    );
}

async function getFileID(filter, parent) {
    const request = await fetch(drive_end + '?q=%27' + parent +
        '%27 in parents and' + filter, makeRequest('GET'));
    const list = await request.json();
    return list.files[0].id;
}

function makeRequest(method, body) {
    return {
        method: method,
        headers: {
            'Accept': 'application/x-www-form-urlencoded',
            'Authorization': 'Bearer ' + profile.access_token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    }
}

function openTab(event, tabName, type = 'flex') {
    const tabs = document.getElementById('content').children;
    for (let i = 0; i < tabs.length; i++) {
        tabs[i].style.display = "none";
    }

    const navbuttons = document.getElementById('header').children;
    for (let i = 0; i < navbuttons.length; i++) {
        navbuttons[i].className = '';
    }
    document.getElementById(tabName).style.display = type;
    event.currentTarget.className = "active";
}

function submitCustomerInformation(event) {
    event.preventDefault();
    const data = new FormData(event.target);
    fetch(sheets_end + '/' + currentSheet, makeRequest('GET')).then(response =>
        response.json()).then(json => {
            let rowCount = json.sheets[0].properties.gridProperties.rowCount;
            if (rowCount === 2) {
                updateSheet(currentSheet, [{
                    updateSheetProperties: {
                        properties: {
                            gridProperties: { frozenRowCount: 1 }
                        },
                        fields: 'gridProperties.frozenRowCount'
                    }
                }]);
            }

            updateSheet(currentSheet, [{
                appendCells: {
                    rows: [{
                        values: [
                            { userEnteredValue: { numberValue: rowCount } },
                            { userEnteredValue: { stringValue: data.get('name') } },
                            { userEnteredValue: { stringValue: data.get('surname') } },
                            {
                                userEnteredValue: {
                                    numberValue: data.get('phonenumber') === '' ?
                                        null : data.get('phonenumber')
                                }
                            },
                            {
                                userEnteredValue: {
                                    numberValue: data.get('whatsapp') === '' ?
                                        null : data.get('whatsapp')
                                }
                            },
                            { userEnteredValue: { stringValue: data.get('email') } },
                            { userEnteredValue: { stringValue: data.get('location') } },
                            {
                                userEnteredValue: {
                                    numberValue: new Date().getTime() / 86400000 + 25569
                                },
                                userEnteredFormat: {
                                    numberFormat: {
                                        type: "DATE_TIME", pattern: "ddd dd hh:mm"
                                    }
                                }
                            },
                            { userEnteredValue: { boolValue: false } }
                        ]
                    }],
                    fields: 'userEnteredValue, userEnteredFormat.numberFormat'
                }
            }]);
        });
    openTab(event, 'create');
    document.getElementById('resetButton').click();
}

function setupTables(sheetID = currentSheet) {
    fetch(sheets_end + '/' + sheetID + '/values/Customers!A2:I', makeRequest('GET'))
        .then(response => response.json()).then(json => {
            const pending = document.getElementById('pendingQuotations');
            const table = document.getElementById('quotationTable');
            json.values.forEach(function (data) {
                const row = table.insertRow(-1);
                row.className = 'done';
                for (let i = 0; i < 9; i++) {
                    if (i === 0) {
                        row.onclick = function () {
                            console.log(data[i]);
                        }
                        row.insertCell(i).innerHTML = data[i];
                    } else if (i === 8 && data[8] === 'FALSE') {
                        const prow = pending.insertRow(-1);
                        prow.insertCell(0).innerHTML = data[0];
                        prow.insertCell(1).innerHTML = data[1];
                        prow.insertCell(2).innerHTML = data[7];
                        prow.onclick = function () {
                            console.log(data[0]);
                        }
                        prow.className = 'pending';
                        row.className = 'pending';
                        row.insertCell(i).innerHTML = "PENDING";
                    } else if (i === 8) row.insertCell(i).innerHTML = "DONE";
                    else row.insertCell(i).innerHTML = data[i];
                }
            });
        });
}

function filterQuotations() {
    var input, filter, table, tr, td, i, txtValue;
    input = document.getElementById("quotationSearch");
    filter = input.value.toUpperCase();
    table = document.getElementById("quotationTable");
    tr = table.getElementsByTagName("tr");
    for (i = 0; i < tr.length; i++) {
        td = tr[i].getElementsByTagName("td")[0];
        if (td) {
            txtValue = td.textContent || td.innerText;
            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                tr[i].style.display = "";
            } else {
                tr[i].style.display = "none";
            }
        }
    }
}

function sortQuotationTable() {
    var table, rows, switching, i, x, y, shouldSwitch;
    table = document.getElementById("quotationTable");
    switching = true;
    /*Make a loop that will continue until
    no switching has been done:*/
    while (switching) {
        //start by saying: no switching is done:
        switching = false;
        rows = table.rows;
        /*Loop through all table rows (except the
        first, which contains table headers):*/
        for (i = 1; i < (rows.length - 1); i++) {
            //start by saying there should be no switching:
            shouldSwitch = false;
            /*Get the two elements you want to compare,
            one from current row and one from the next:*/
            x = rows[i].getElementsByTagName("TD")[0];
            y = rows[i + 1].getElementsByTagName("TD")[0];
            //check if the two rows should switch place:
            if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
                //if so, mark as a switch and break the loop:
                shouldSwitch = true;
                break;
            }
        }
        if (shouldSwitch) {
            /*If a switch has been marked, make the switch
            and mark that a switch has been done:*/
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
        }
    }
}

function checkWhatsapp() {
    const whatsappInput = document.getElementById('whatsappInput');
    if (document.getElementById('whatsappCheck').checked) {
        whatsappInput.disabled = false;
        whatsappInput.value = document.getElementById('phoneInput').value;
    } else {
        whatsappInput.disabled = true;
        whatsappInput.value = null;
    }
}

function clickme() { console.log('ffffff'); }