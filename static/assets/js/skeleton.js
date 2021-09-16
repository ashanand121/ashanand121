function showApplyBtn(obj) {
    if (obj.value.toString().trim() !== "") {
        document.querySelector('#btn-search-data').classList.add("active");
    } else {
        document.querySelector('#btn-search-data').classList.remove("active");
    }
    if (this.event.keyCode === 13) {
        this.event.preventDefault();
        document.getElementById("btn-search-data").click();
    }
}

function fillNavSearchInput(selected_data){
    let selected_text = '';
    if(selected_data == 'nav_dd_scrubber'){ selected_text = $("#"+selected_data+" option:selected").text(); }
    else{selected_text = selected_data.split(":")[0];
        if(selected_data.length > 12){$('#dd_btn_scrubbers').html(selected_data.slice(0,13))}
        else{$('#dd_btn_scrubbers').html(selected_data);}
        document.querySelector('#dd_user_scrubbers').classList.add('hide-this');
    }
    if(selected_text != '' && selected_text != null){
        $("#searchq").val(selected_text);
        let search_btn = document.getElementById("btn-search-data");
        search_btn.classList.add("active");
        search_btn.click();
    }
}

function searchData() {
    var filterValue = document.getElementById("searchq").value;
    if(filterValue.match(/\w+[-]\d+[: ]/) != null){filterValue = filterValue.split(": ")[0];$("#searchq").val(filterValue );}
    else{let words = filterValue.split('/');if (words.length != 1) { filterValue = words[words.length - 1]; if (filterValue == '') { filterValue = words[words.length - 2]; } }}
    window.open('/' + filterValue);
}

$(document).on('click','#dd_user_scrubbers p',function(){fillNavSearchInput($(this).text());});

async function get_user_scrubber_list(user) {
    let opt_dd = document.getElementById('dd_user_scrubbers');
    if(opt_dd.classList.contains('hide-this')){
        opt_dd.classList.remove('hide-this');
        let num_ptag = document.querySelector('#dd_user_scrubbers p')
        if(num_ptag == null){
            let scrubber_list = await search_scrubber_list(user);
            if(scrubber_list[0] != 0){
                let op_html='';
                for(let i=0;i<scrubber_list.length;i++){op_html = op_html + '<p class="option_dd_scrubber">'+scrubber_list[i]+'</p>';};
                $('#dd_user_scrubbers').html(op_html);
            }
        }else{$('#dd_btn_scrubbers').html('My Scrubbers');}
    }
    else{opt_dd.classList.add('hide-this');}
}

async function search_scrubber_list(user) {
    try {
        let res = await fetch("get_user_scrubber_list/", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json;charset=UTF-8'
            },
            body: JSON.stringify({
                "user": user.toLowerCase()
            })
        });
        data = await res.json();
        return data.scrubber_list

    } catch (err) {
        console.log("Error in Fetching User's scrubber list: "+ String(err));
        return [0]
    }
}
var suggestions_list = [];
var searched_scrubber = '';
function searchCallback(searchbar, delay) {
    var timer = null;
    searchbar.onkeypress = function() {
        if (timer) {
            window.clearTimeout(timer);
        }
        timer = window.setTimeout( function() {
            timer = null;
              //  if($("#searchq").val().slice(-1) == '-' && $("#searchq").val() != searched_scrubber){
              if($("#searchq").val() != searched_scrubber){
                searched_scrubber = $("#searchq").val();
                // var pr = search_scrubber_list($("#searchq").val().slice(0,-1));
                var pr = search_scrubber_list($("#searchq").val());
                pr.then(function(val) {
                    suggestions_list = val;
                    $( "#searchq" ).autocomplete({
                      source: suggestions_list
                    });
                    let e = jQuery.Event("keydown");
                    e.keyCode = 40;
                    e.key = 'ArrowDown';
                    $("#searchq").trigger(e);
                });
            }
        }, delay );
    };
    searchbar = null;
}
searchCallback( document.getElementById("searchq"), 1000 );

$(document).on('click','#ui-id-1 .ui-menu-item',function(){
    let search_btn = document.getElementById("btn-search-data");
    search_btn.click();
});

