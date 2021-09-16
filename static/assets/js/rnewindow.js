function toggle_window() {
	var x = document.getElementById("edit-rne-window");

	if ($('#edit-rne-window').css('display') == "none") {
		//x.style.display = "block";
		$('#edit-rne-window').css('display', 'block');
		dragElement(x);

		function dragElement(elmnt) {
			var pos1 = 0,
				pos2 = 0,
				pos3 = 0,
				pos4 = 0;
			if (document.getElementById("btn-move-rne-window")) {
				/* if present, the header is where you move the DIV from:*/
				document.getElementById("btn-move-rne-window").onmousedown = dragMouseDown;
			} else {
				/* otherwise, move the DIV from anywhere inside the DIV:*/
				elmnt.onmousedown = dragMouseDown;
			}

			function dragMouseDown(e) {
				e = e || window.event;
				e.preventDefault();
				// get the mouse cursor position at startup:
				pos3 = e.clientX;
				pos4 = e.clientY;
				document.onmouseup = closeDragElement;
				// call a function whenever the cursor moves:
				document.onmousemove = elementDrag;
			}

			function elementDrag(e) {
				e = e || window.event;
				e.preventDefault();
				// calculate the new cursor position:
				pos1 = pos3 - e.clientX;
				pos2 = pos4 - e.clientY;
				pos3 = e.clientX;
				pos4 = e.clientY;
				// set the element's new position:
				elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
				elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
			}

			function closeDragElement() {
				/* stop moving when mouse button is released:*/
				document.onmouseup = null;
				document.onmousemove = null;
			}
		}
	} else {
		$('#edit-rne-window').css('display', 'none');
	}
}
$(document).on('click', '#btn-dismiss-rne-window', function () {
	toggle_window();
});

$(document).on('click', '#helper-collapse', function () {
	document.getElementById("rne-guidelines").classList.toggle('expanded');
	document.getElementById('rne-guidelines').addEventListener('click', toggleHelperSection);
});

function toggleHelperSection() {
	document.getElementById("rne-guidelines").classList.toggle('expanded');
	document.getElementById("edit-rne-body").classList.toggle('expanded');
	document.getElementById('rne-guidelines').removeEventListener('click', toggleHelperSection);
}

document.getElementById('rne-guidelines').removeEventListener('click', toggleHelperSection);

function fetchData(bugid) {
	console.log('sent: ' + bugid);
	$('#edit-rne-bugid').text(bugid);
	$.ajax({
		type: "GET",
		url: "/rneqc/rne_window/" + bugid
	}).done(function (data) {
		document.getElementById("edit-rne-form").innerHTML = data;
		$("#edit-rne-headline").val($('#bug_headline_' + bugid).html());
		toggle_window();
	});
}

function rneInputFocus(bugid, name) {
	let targetid = '#' + name + '-ta-' + bugid;
	let this_el = '#' + name + '-' + bugid;
	$(targetid).show();
	$(targetid).val($(this_el).val());
	$(this_el).hide();
	$(targetid).focus();
	let targetid2 = '#RNE_' + name;
	if ($(targetid2).css('display') == 'none') {
		$('#edit-rne-body-info > div').hide();
		$(targetid2).css('display', 'block');
	}
	if ($('#helper-collapse').css('display') == 'none') {
		$('#helper-collapse').css('display', 'block')
	}
}

function rneInputFocusOut(bugid, name) {
	let targetid = '#' + name + '-' + bugid;
	let this_el = '#' + name + '-ta-' + bugid;
	let dt = $(this_el).val();
	$(targetid).val(dt);
	$(this_el).hide();
	$(targetid).show();
}

function hdfInputFocus(name) {
	let targetid = "#RNE_" + name;
	if ($(targetid).css('display') == 'none') {
		$('#edit-rne-body-info > div').hide();
		$(targetid).css('display', 'block');
	    if(name == 'description'){name = 'problem description';}
		$('#helper-expand').text('Guidelines '+name.charAt(0).toUpperCase() + name.slice(1));
	}
	if ($('#helper-collapse').css('display') == 'none') {
		$('#helper-collapse').css('display', 'block');
	}
}

function resetRNE(bugid) {
	let targetid = 'form_rne_' + bugid;
	document.forms[targetid].reset();
	$("#edit-rne-headline").val($('#bug_headline_' + bugid).html());
}

function cancelRNE(bugid) {
	let targetidform = 'form_rne_' + bugid;
	document.forms[targetidform].reset();
	toggle_window();
}

function validateRNE(ele, bugid, flag) {
	ele.classList.remove('btn-success');
	ele.classList.add('btn-warning');
	ele.innerHTML = '';
	ele.innerHTML = 'Saving...';
	let url = "/save_rne/" + bugid;
	//Check for change in Bug headline
	let new_headline_data = '';
	if ($("#edit-rne-headline").val().trim() != $('#bug_headline_' + bugid).html().trim()) {
		new_headline_data = $("#edit-rne-headline").val().trim();
	}
	var new_data = {
		publication: $('#rne-flag-' + bugid).val(),
		symptoms: $('#symptoms-' + bugid).val(),
		conditions: $('#conditions-' + bugid).val(),
		workaround: $('#workaround-' + bugid).val(),
		description: $('#description-' + bugid).val(),
		headline: new_headline_data,
		bugid: bugid
	};
	$.ajax({
			data: new_data,
			type: 'POST',
			url: url
		})
		.done(function (data, response) {
			ele.classList.remove('btn-warning');
			ele.classList.add('btn-success');
			ele.innerHTML = '';
			ele.innerHTML = 'Save';
			if (response != 'success') {
				alert("Error In Writing RNE. Please try again.");
				toggle_window();
			} else {
				new_view_html = `<div class="row">
                      <div class="col-12">
                        <div class="form-group row mb-1">
                          <label
                            for="new-query-title"
                            class="col-3 col-form-label my-auto smaller-font"
                            ><strong>RNE Publication Restrictions</strong></label
                          >
                          <div
                            class="col-9 input-group input-group-sm smaller-font"
                            style="padding: 0px"
                          >
                            <span>
                              publicationdata</span
                            >
                          </div>
                        </div>
                        <div class="form-group row mb-1">
                          <label
                            for="new-query-title"
                            class="col-3 col-form-label smaller-font"
                            ><strong>Symptoms</strong></label
                          >
                          <div class="col-9" style="padding: 0px">
                            <span>
                              symptomsdata</span
                            >
                          </div>
                        </div>
                        <div class="form-group row mb-1">
                          <label
                            for="new-query-title"
                            class="col-3 col-form-label smaller-font"
                            ><strong>Conditions</strong></label
                          >
                          <div class="col-9" style="padding: 0px">
                            <span>
                              conditionsdata</span
                            >
                          </div>
                        </div>
                        <div class="form-group row mb-1">
                          <label
                            for="new-query-title"
                            class="col-3 col-form-label smaller-font"
                            ><strong>Workaround</strong></label
                          >
                          <div class="col-9" style="padding: 0px">
                            <span>
                              workarounddata</span
                            >
                          </div>
                        </div>
                        <div class="form-group row mb-1">
                          <label
                            for="new-query-title"
                            class="col-3 col-form-label smaller-font"
                            ><strong>Further Problem Description</strong></label
                          >
                          <div class="col-9" style="padding: 0px">
                            <span>
                              descriptiondata</span
                            >
                          </div>
                        </div>
                      </div>
                    </div>
                    `;
				new_view_html = new_view_html.replace(/publicationdata/g, new_data['publication']);
				new_view_html = new_view_html.replace(/symptomsdata/g, new_data['symptoms']);
				new_view_html = new_view_html.replace(/conditionsdata/g, new_data['conditions']);
				new_view_html = new_view_html.replace(/workarounddata/g, new_data['workaround']);
				new_view_html = new_view_html.replace(/descriptiondata/g, new_data['description']);
				let targetdiv = '#show-rne-container-' + bugid;
				$(targetdiv).html('');
				$(targetdiv).html(new_view_html);
				$('#bug_headline_' + new_data['bugid']).html($("#edit-rne-headline").val());
				//toggle_window();
			}
		});
}