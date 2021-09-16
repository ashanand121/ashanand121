
const sortingFields = {}
var flag_reneqc_comment = ['sm'];
var statuschange = false;
const spinnerHTML = ' <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

function formatDate(date) {
    if (date !== undefined && date !== "") {
        var myDate = new Date();
        myDate.setFullYear(date.split('-')[0])
        myDate.setMonth(date.split('-')[1] - 1)
        myDate.setDate(date.split('-')[2])
        var str = `${myDate.getMonth()+1}/${myDate.getDate()}`;
        return str;
    }
    return "";
}
  
function formatMeta(meta) {
    const formattedMeta = meta.replace('{', '').replaceAll(':', '').replace('}', '');
    const date = formatDate(formattedMeta.split(' ')[0]);
    const user = formattedMeta.split(' ')[1];
    return `<br><b>${date} ${user}</b> - `;
}

function formatNotes(bugid = undefined) {
    querySelector = bugid === undefined ? '.previous-notes-container' : `#previous-notes-${bugid}`;
    document.querySelectorAll(querySelector).forEach(dom => {
        var processedData = dom.innerHTML;
        if( bugid === undefined && processedData.trim() == '' ){$(dom).prev('.display-notes-container')[0].classList.add("empty-notes");}

        const prevMeta = [... new Set(processedData.match(/\d{1,2}\/\d{1,2}\s\w+\s\-/g))]
        if (prevMeta != null) {
            prevMeta.map(meta => {
                const date = meta.split(' ')[0];
                const newDate = `2021-${date.split('/')[0]}-${date.split('/')[1]}`;
                const user = meta.split(' ')[1];
                const newMeta = `{${newDate} :${user}:}`;
                processedData = processedData.replaceAll(meta, newMeta);
            });
        }
        dom.innerHTML = processedData;
        const metadata = [...new Set(processedData.match(/\{\d{4}-\d{1,2}-\d{1,2}\s\:[a-z0-9]+\:\}/g))];
        metadata.map(meta => {
            const formattedMeta = formatMeta(meta);
            processedData = processedData.replaceAll(meta, formattedMeta)
        })
        processedData = processedData.trim().replaceAll('[', '[<i style="opacity: 0.5; font-size: 0.8em; padding-right:3px;">')
            .replaceAll(']', '</i>]')
            .replace("<br>", "");
        document.getElementById(`display-notes-${dom.dataset.bugid}`).innerHTML = processedData;
    })
}


function getCurrentDate() {
    return (new Date()).toDateString().split(' ').slice(1, 4).join(' ');
}

function showRne(obj, bug_id){
    let target_id = '#show-rne-container-'+bug_id;
    if($(target_id).hasClass('show')){
        $(target_id).removeClass('show');
        $('#display-notes-'+bug_id).removeClass('responsive');
        $('#display-notes-'+bug_id).css({'height': '100px','maxHeight': '100px'});
        obj.children[0].innerHTML = "Show";
    }
    else{
        $(target_id).addClass('show');
        $('#display-notes-'+bug_id).addClass('responsive');
        let dom = document.getElementById('display-notes-'+bug_id);
        let row_height = `${dom.parentElement.offsetHeight - dom.offsetTop}px`;
        $('#display-notes-'+bug_id).css({'height': row_height,'maxHeight': row_height});
        obj.children[0].innerHTML = "Hide";
    }
}

function arrayRemove(arr, item) {
    let temp_array = []
    for (var i = 0; i < arr.length; i++) { if (arr[i] != item) { temp_array.push(arr[i]); } }
    return temp_array
}

var toggleNotes = function (obj) {
    obj.disabled = true;
    current_state = obj.getAttribute('data-toggle');
    notesDOMs = document.getElementsByClassName('display-notes-container');
    if (current_state == 'hide') {
        for (let i = 0; i < notesDOMs.length; i++) {
            notesDOMs[i].setAttribute('style', 'display: auto;');
            notesDOMs[i].style.display = "auto"
        }
        $('.toggle-notes').attr('data-toggle', 'show');$('.toggle-notes').html('Hide Notes');
    } else {
        for (let i = 0; i < notesDOMs.length; i++) {
            notesDOMs[i].setAttribute('style', 'display: none;');
            notesDOMs[i].style.display = "none"
        }
        $('.toggle-notes').attr('data-toggle', 'hide');$('.toggle-notes').html('Show Notes');
    }
    obj.disabled = false;
    return false;
};

function resetFeedbackMessage(bugid) {
    const notesFeedbackDom = document.getElementById(`update-message-${bugid}`);
    notesFeedbackDom.innerHTML = '';
    notesFeedbackDom.classList.add('hide-this');
    notesFeedbackDom.classList.remove("success");
    notesFeedbackDom.classList.remove("warning");
    notesFeedbackDom.classList.remove("danger");
}

function logFeedbackMessage(logType, bugid, message) {
    // Resetting the logging dom
    resetFeedbackMessage(bugid);
    const notesFeedbackDom = document.getElementById(`update-message-${bugid}`);
    notesFeedbackDom.classList.remove("hide-this");
    if (logType == "success")
        setTimeout(() => {
            resetFeedbackMessage(bugid)
        }, 5000);
    notesFeedbackDom.classList.add(logType);
    notesFeedbackDom.innerHTML = message;
}

async function validateNote(bugid, emptyNoteMessage="Please provide some note comment") {
    const new_note = document.getElementById("new-note-" + bugid).value.trim();
    if (new_note == '') {
        logFeedbackMessage("danger", bugid, emptyNoteMessage);
        $(`#note-container-${bugid}`).collapse("show");
        return false;
    }
    return true;
}

async function addNote(bugid, user, successMessage="Note Added successfully", rneqc_action=null) {
    if (!await validateNote(bugid)) return false;
    
    const new_note = document.getElementById("new-note-" + bugid).value.trim();
    const oldNoteDOM = document.getElementById("previous-notes-" + bugid);
    let note_old_value = oldNoteDOM.innerText.trim().replaceAll('\n', '');
    const metadata = [... new Set(note_old_value.match(/\{\d{4}-\d{1,2}-\d{1,2}\s\:[a-z0-9]+\:\}/g))];
    metadata.map(meta => {
        note_old_value = note_old_value.replaceAll(meta, `\n${meta}`);
    });
    const currDate = new Date();
    const note = `{${currDate.getFullYear()}-${currDate.getMonth() + 1}-${currDate.getDate()} :${user}:} ${rneqc_action ? "[" + rneqc_action + "] " : ""}${new_note.trim()}\n${note_old_value.trim()}`;
    try {
        let res = await fetch(`save_rneqc_notes/${bugid}/`, {
            method: note_old_value.trim() == "" ? "POST" : "PUT",
            headers: {
                'Content-Type': 'application/json;charset=UTF-8'
            },
            body: JSON.stringify({
                // attribute: final_attribute,
                notes: note
            })
        })
        let data = await res.json();
        console.log(data);
        if (data["status"] === "success") {
            oldNoteDOM.innerHTML = data["note"].replace('\n', ' ');
            formatNotes(bugid);
            logFeedbackMessage("success", bugid, successMessage);
            document.getElementById("new-note-" + bugid).value = "";
            $(`#note-container-${bugid}`).collapse("hide");
        } else if (data["status"] === "failed") {
            logFeedbackMessage("danger", bugid, data["error"]);
        }
    } catch (err) {
        logFeedbackMessage("danger", bugid, err);
    }
    return true;
}

async function save_attribute_notes(obj, bugid, user) {
    const actualHTML = obj.innerHTML;
    obj.innerHTML = `Saving ${spinnerHTML}`;
    
    const rneqcStatusDOM = document.getElementById(`rneqc-status-${bugid}`);
    if (rneqcStatusDOM.value !== rneqcStatusDOM.dataset.value) {
        if (await validateNote(bugid, emptyNoteMessage = "You need to provide a note for updating status")) {
            // Updating Attribute
            console.log("Updating RNEQC Status");
            previousAttributes = rneqcStatusDOM.dataset.attributes.split(' ');
            console.log({previousAttributes});
            let user_attr_list =  previousAttributes.filter(function(attr){if(attr.match(/RNEQC-RequestID-\w+/) != null){return attr;}});
            let user_attr = ''; if(user_attr_list.length != 0){user_attr = user_attr_list[0];}
            newAttributes = previousAttributes.filter(function (attr) {return attr.match(/RNEQC[\w\-]+/g) == null});
            newAttributes.push(rneqcStatusDOM.value);
            if( rneqcStatusDOM.value == 'RNEQC-update-requested' ){ user_attr = 'RNEQC-RequestID-'+user; }
            if( user_attr != ''){ newAttributes.push(user_attr); }
            console.log({ newAttributes });
            try {
                let res = await fetch(`save_attribute/${bugid}/`, {
                    method: "PUT",
                    headers: {
                        'Content-Type': 'application/json;charset=UTF-8'
                    },
                    body: JSON.stringify({
                        attribute: newAttributes.join(' ')
                    })
                })
                let data = await res.json();
                console.log({ data });
                if (data["status"] === "success") {
                    rneqcStatusDOM.dataset.value = rneqcStatusDOM.value;
                    rneqcStatusDOM.dataset.attributes = data['attribute'];
                    updateRneqcStatusFilter();
                    await addNote(bugid, user, "Status has been updated successfully", `updated status to ${rneqcStatusDOM.value}`);
                    document.getElementById("new-note-" + bugid).value = "";
                } else if (data["status"] === "failed") {
                    logFeedbackMessage("danger", bugid, data["error"]);
                }
            } catch (err) {
                    logFeedbackMessage("danger", bugid, err);
            }
        }
    } else {
        await addNote(bugid, user);
    }
    
    obj.innerHTML = actualHTML;
}

function handleRneqcStatus(obj, bugid){
    let visible_rneqc_status = []
    $(`#note-container-${bugid}`).collapse("show");
}

function handleThemeChange(obj, lastUpdated) {
    const selectedTheme = obj.value;
    document.getElementById("theme-link").href = `/static/assets/css/themes/${selectedTheme}.css?u=${lastUpdated}`;
    return false;
}

function resetRneEditLogger() {
    document.getElementById("edit-rne-logger").classList.remove("success");
    document.getElementById("edit-rne-logger").classList.remove("danger");
    document.getElementById("edit-rne-logger").innerHTML = "";
}

function resetRne(obj) {
    document.getElementById("edit-rne-headline").value = document.getElementById("edit-rne-headline").dataset.previous;
    document.getElementById("edit-rne-flag").value = document.getElementById("edit-rne-flag").dataset.previous;
    document.getElementById("edit-rne-symptoms").value = document.getElementById("edit-rne-symptoms").dataset.previous;
    document.getElementById("edit-rne-conditions").value = document.getElementById("edit-rne-conditions").dataset.previous;
    document.getElementById("edit-rne-workaround").value = document.getElementById("edit-rne-workaround").dataset.previous;
    document.getElementById("edit-rne-description").value = document.getElementById("edit-rne-description").dataset.previous;
}

function editRNE(obj, bugid, addRne = false) {
    document.querySelectorAll('.edit-rne-input, .btn-edit-actions').forEach(e => {
        e.dataset.bugid = bugid
    });
    document.getElementById("edit-rne-bugid").innerText = bugid;
    document.getElementById("edit-rne-headline").value = document.getElementById(`bug_headline_${bugid}`).innerText;

    if (!addRne) {
        const rneContainer = document.getElementById(`show-rne-container-${bugid}`);
        console.log({ rneContainer });
        const rneData = document.querySelectorAll(`#show-rne-container-${bugid} .rne-data`);
        console.log({ rneData });
        const rneRestriction = rneData[0].innerText.trim();
        let rneFlag = "";
        if(rneRestriction.match(/[$][$]\w+/) != null){rneFlag = rneRestriction.match(/[$][$]\w+/)[0];}
        const symptoms = rneData[1].innerText.trim();
        const conditions = rneData[2].innerText.trim();
        const workaround = rneData[3].innerText.trim();
        const description = rneData[4].innerText.trim();

        document.getElementById("edit-rne-flag").value = rneFlag === "" ? "NONE" : rneFlag.replaceAll('$', '');
        document.getElementById("edit-rne-symptoms").value = symptoms;
        document.getElementById("edit-rne-conditions").value = conditions;
        document.getElementById("edit-rne-workaround").value = workaround;
        document.getElementById("edit-rne-description").value = description;

        document.getElementById("edit-rne-headline").dataset.previous = document.getElementById(`bug_headline_${bugid}`).innerText;
        document.getElementById("edit-rne-flag").dataset.previous = rneFlag.replaceAll('$', '');
        document.getElementById("edit-rne-symptoms").dataset.previous = symptoms;
        document.getElementById("edit-rne-conditions").dataset.previous = conditions;
        document.getElementById("edit-rne-workaround").dataset.previous = workaround;
        document.getElementById("edit-rne-description").dataset.previous = description;

        console.log({ rneFlag, symptoms, conditions, workaround, description });
    } else {
        document.getElementById("edit-rne-headline").dataset.previous = document.getElementById(`bug_headline_${bugid}`).innerText;
        document.getElementById("edit-rne-flag").dataset.previous = "NONE";
        document.getElementById("edit-rne-symptoms").dataset.previous = "";
        document.getElementById("edit-rne-conditions").dataset.previous = "";
        document.getElementById("edit-rne-workaround").dataset.previous = "";
        document.getElementById("edit-rne-description").dataset.previous = "";
    }
    document.getElementById("btn-rne-save").dataset.addrne = addRne;
    document.getElementById("btn-rne-save").innerHTML = "Save";
    resetRneEditLogger();
    toggle_window();
}

async function saveRne(obj) {
    const bugid = obj.dataset.bugid;
    const previousHTML = obj.innerHTML;
    resetRneEditLogger();
    obj.innerHTML = "Saving " + spinnerHTML;
    const rneFlag = document.getElementById("edit-rne-flag").value == "NONE" ? "NONE" : `$$${document.getElementById("edit-rne-flag").value}`;
    try {
        let res = await fetch(`save_rne/`, {
            method: "PUT",
            headers: {
                'Content-Type': 'application/json;charset=UTF-8'
            },
            body: JSON.stringify({
                "bugid": bugid,
                "headline": document.getElementById("edit-rne-headline").value,
                "rneFlag": rneFlag,
                "symptoms": document.getElementById("edit-rne-symptoms").value,
                "conditions": document.getElementById("edit-rne-conditions").value,
                "workaround": document.getElementById("edit-rne-workaround").value,
                "description": document.getElementById("edit-rne-description").value
            })
        })
        let data = await res.json();
        console.log(data);
        if (data["status"] === "success") {
            // const newRneContent = `<b>RNE Publication</b><br>${data["data"]["rneFlag"]}<hr><b>Symptoms:</b><br>${data["data"]["symptoms"]}<hr><b>Conditions:</b><br>${data["data"]["conditions"]}<hr><b>Workaround</b><br>${data["data"]["workaround"]}<hr><b>Furter Problem Description</b><br>${data["data"]["description"]}`
            const newRneContent = `
            <b>RNE Publication Restrictions</b>
            <br>
            <span class="rne-data">
            ${data["data"]["rneFlag"]}
            </span>
            <hr>
            <b>Symptoms:</b>
            <br>
            <span class="rne-data">
            ${data["data"]["symptoms"]}
            </span>
            <hr>
            <b>Conditions:</b>
            <br>
            <span class="rne-data">
            ${data["data"]["conditions"]}
            </span>
            <hr>
            <b>Workaround</b>
            <br>
            <span class="rne-data">
            ${data["data"]["workaround"]}
            </span>
            <hr>
            <b>Furter Problem Description</b>
            <br>
            <span class="rne-data">
            ${data["data"]["description"]}
            </span>
        `
            document.getElementById(`show-rne-container-${bugid}`).innerHTML = newRneContent;
            document.getElementById(`bug_headline_${bugid}`).innerText = data["data"]["headline"];
            document.getElementById("edit-rne-logger").classList.add("success");
            document.getElementById("edit-rne-logger").innerHTML = "RNE saved successfully";

            document.getElementById("edit-rne-headline").dataset.previous = data["data"]["headline"];
            document.getElementById("edit-rne-flag").dataset.previous = data["data"]["rneFlag"];
            document.getElementById("edit-rne-symptoms").dataset.previous = data["data"]["symptoms"];
            document.getElementById("edit-rne-conditions").dataset.previous = data["data"]["conditions"];
            document.getElementById("edit-rne-workaround").dataset.previous = data["data"]["workaround"];
            document.getElementById("edit-rne-description").dataset.previous = data["data"]["description"];

            if (obj.dataset.addrne) {
                const content = `
                <button class="btn-view-rne btn-rne-action" data-bugid="${bugid}" id="rne-toggle-${bugid}"
                        onclick="showRne(this, '${bugid}')"><span class="action">Show</span> <span class="rne">Release-note</span></button>
                <button
                    id="${bugid}-rne-edit"
                    title="Edit RNE"
                    onclick="return editRNE(this, '${bugid}');"
                    style="cursor: pointer;"
                    >
                    <img src="/static/assets/img/icon-edit.svg" alt="Edit RNE" width="20" height="20">
                </button>
                <hr id="rne-divider" class="show">
            `
                document.getElementById(`addnote_${bugid}`).innerHTML = content;
            }
            setTimeout(() => {
                resetRneEditLogger();
            }, 5000);
            setOffenderRows().then(updateRneFilter());

        } else if (data["status"] === "failed") {
            document.getElementById("edit-rne-logger").classList.add("danger");
            document.getElementById("edit-rne-logger").innerHTML = "Failed - " + data["error"];
        }
    } catch (err) {
        document.getElementById("edit-rne-logger").classList.add("danger");
        document.getElementById("edit-rne-logger").innerHTML = "Failed - " + err;
    }
    obj.innerHTML = previousHTML;
}

document.addEventListener("DOMContentLoaded", async () => {
     const thead = document.querySelector('.main-table-header');
     const fixedThead = document.getElementById('fixed-table');
     const table = document.getElementById('query-table');
     const navBar = document.querySelector('.nav-bar');
     var flag = true;
     window.addEventListener("scroll", function (event) {
            scrollTop = this.scrollY;
            if(scrollTop >= 120 && flag){$('#fixed_table').removeClass('hide-this');flag = false;}
            if(scrollTop < 120 && !flag){$('#fixed_table').addClass('hide-this');flag = true;}
     });
});

$(document).ready(function () {
    user = $('#current_user').val();
    const currentDate = getCurrentDate();
    document.querySelectorAll('.credentials .current-date').forEach(dom => dom.innerHTML = currentDate);
    formatNotes();
    document.querySelectorAll('.rne-res-data').forEach(dom => {
        let res_d = dom.textContent;let regex=/[$][$]/gm;let temp_list = [];
        while ((match = regex.exec(res_d)) !== null) { temp_list.push(match.index);}
        if(temp_list.length > 1){res_d = res_d.slice(temp_list[0],temp_list[1]);}
        dom.textContent = res_d;
    });
    document.querySelectorAll('.rne-status-dropdown').forEach(dom => {
        const attributes = dom.dataset.attributes;
        const bugid = dom.dataset.bugid;
        let rneqcAttributes = attributes.match(/RNEQC[\w\-]+/g);
        if (rneqcAttributes === null) {document.querySelector(`#rneqc-status-${bugid} option[data-status="----"]`).selected = true;}
        else{
            rneqcAttributes = rneqcAttributes.filter(function(attr){if(attr.match(/RNEQC-RequestID-\w+/) == null){return attr;}});
            const selectedRneqcStatus = rneqcAttributes[0];
            document.querySelector(`#rneqc-status-${bugid} option[data-status="${selectedRneqcStatus}"]`).selected = true;
            dom.dataset.value = selectedRneqcStatus;
        }
    });
});