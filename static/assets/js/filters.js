var hidden_rows = {'status': [], 'releasedCode':[], 'component': [], 'director': [], 'manager': [], 'engineer': [], 'rneqcstatus': [], 'priority': [], 'severity': [], 'rne': []};
function getFinalHiddenRows(){
    let temp_array = [];
    for(const key in hidden_rows){
        for(let i=0;i<hidden_rows[key].length;i++){
            if(temp_array.includes(hidden_rows[key][i])){}else{temp_array.push(hidden_rows[key][i]);}
        }
    }
    return temp_array;
}
function assign_filter_options(target_select,options_array,flag_reset){
    let select_name = target_select.split('_')[0];
    let temp_dict = {};
    for(let i=0;i<options_array.length;i++){if(options_array[i] in temp_dict){temp_dict[options_array[i]] = temp_dict[options_array[i]] + 1;}else{temp_dict[options_array[i]] = 1;}}
    if(select_name == 'rne'){setRneStatistic(temp_dict);}
    let options_html = '';
    if(flag_reset){
        options_html = '<option value="Default">--'+ select_name.charAt(0).toUpperCase()+select_name.slice(1) +'--</option>';
        for(const key in temp_dict){options_html = options_html + '<option value="'+ key +'">'+ key + ' ' + '(' + temp_dict[key] +')'+'</option>';}
        if(select_name == 'rneqcstatus'){setRneqcStatusStatistic(temp_dict,true);}
    }
    else{
        if(select_name == 'rneqcstatus'){let flag_toggle_rne = get_all_rne_visible_data();setRneqcStatusStatistic(temp_dict,flag_toggle_rne);}
        let current_filter_select_value = document.getElementById(target_select).value;
        if(current_filter_select_value == 'Default'){
            options_html = '<option value="Default">--'+ select_name.charAt(0).toUpperCase()+select_name.slice(1) +'--</option>';
            for(const key in temp_dict){options_html = options_html + '<option value="'+ key +'">'+ key + ' ' + '(' + temp_dict[key] +')'+'</option>';}
        }
        else{
            let flag_default = 0;
            for(const key in temp_dict){
                if(key == current_filter_select_value){options_html = options_html + '<option value="'+ key +'">'+ key + ' ' + '(' + temp_dict[key] +')'+'</option><option value="Default">--'+ select_name.charAt(0).toUpperCase()+select_name.slice(1) +'--</option>';flag_default = 1;break;}
            }
            if(flag_default == 0){options_html = '<option value="Default">--'+ select_name.charAt(0).toUpperCase()+select_name.slice(1) +'--</option>';}
            for(const key in temp_dict){
                if(key != current_filter_select_value){options_html = options_html + '<option value="'+ key +'">'+ key + ' ' + '(' + temp_dict[key] +')'+'</option>';}
            }
        }

    }
    $('#'+target_select).html(options_html);
}
function updateFilter(thisel,target_name){
    let current_filter = thisel.value;
    //remove Filter
    if(current_filter == 'Default'){
        let filter_hidden_rows = hidden_rows[target_name];
        hidden_rows[target_name] = [];
        let final_hidden_rows = getFinalHiddenRows();
        for(let i=0;i<filter_hidden_rows.length;i++){
            if(final_hidden_rows.includes(filter_hidden_rows[i])){}
            else{
                let target_row = $('#count_'+String(filter_hidden_rows[i])).attr("name");
                target_row = target_row.split('_')[1];
                if($('#'+target_row).hasClass('hide-row')){
                    $('#'+target_row).removeClass('hide-row');
                    $('#'+target_row).addClass('show-row');
                }
            }
        }
    }
    //Add Filter
    else{
        let all_data = [];
        if(target_name == 'rneqcstatus'){all_data = $(".dt-"+target_name).map(function() {return this.value;}).get();}
        else if(target_name == 'rne'){all_data = $(".btn-rne-action").map(function() {
            if($(this).closest('tr').hasClass('offender')){return "RNE Offender"}
            else if(this.classList.contains('btn-view-rne')){return "RNE Available";}
            else{return "RNE Missing";}
        }).get();}
        else{all_data = $(".dt-"+target_name).map(function() {return this.textContent;}).get();}
        for(let i=0;i<all_data.length;i++){
            if(all_data[i] != current_filter){
                let final_hidden_rows = getFinalHiddenRows();
                if(final_hidden_rows.includes(i+1)){
                    if(hidden_rows[target_name].includes(i+1)){}else{hidden_rows[target_name].push(i+1);}
                }
                else{
                    let target_row = $('#count_'+String(i+1)).attr("name");
                    target_row = target_row.split('_')[1];
                    if($('#'+target_row).hasClass('show-row')){
                        $('#'+target_row).removeClass('show-row');
                        $('#'+target_row).addClass('hide-row');
                        hidden_rows[target_name].push(i+1);
                    }
                }
            }
            else{
                hidden_rows[target_name] = arrayRemove(hidden_rows[target_name],i+1);
                let final_hidden_rows = getFinalHiddenRows();
                if(final_hidden_rows.includes(i+1)){}
                else{
                    let target_row = $('#count_'+String(i+1)).attr("name");
                    target_row = target_row.split('_')[1];
                    if($('#'+target_row).hasClass('hide-row')){$('#'+target_row).removeClass('hide-row');$('#'+target_row).addClass('show-row');hidden_rows[target_name] = arrayRemove(hidden_rows[target_name],i+1);}
                }
            }
        }
    }
    //Update row-count
    let i = 1;
    $('#rneqc_home_table > tbody  > tr:visible').each(function(index, tr) {
        tr.querySelector(".dynamic-row-count").textContent = String(i);i=i+1;
    });
    $('#span_bug_count').text(String(i-1));
    //Change all Fiters
    let visible_data = {'status': [],'releasedCode':[],'component': [],'director': [],'manager': [],'engineer': [],'rneqcstatus': [],'priority': [],'severity': [],'rne': []};
    $('#rneqc_home_table > tbody  > tr:visible').each(function(index, tr) {
        for(const key in visible_data){
            if(key == 'rneqcstatus'){visible_data[key].push(tr.querySelector(".dt-"+key).value);}
            else if(key == 'rne'){
                if(tr.classList.contains('offender')){visible_data[key].push("RNE Offender");}
                else if(tr.querySelector(".btn-rne-action").classList.contains('btn-view-rne')){visible_data[key].push("RNE Available");}
                else{visible_data[key].push("RNE Missing");}
            }
            else{visible_data[key].push(tr.querySelector(".dt-"+key).textContent);}
        }
    });
    for(const key in visible_data){assign_filter_options(key+'_filter',visible_data[key],false);}
    return true;
}
function setAllFilters(){
    assign_filter_options('rneqcstatus_filter',$(".dt-rneqcstatus").map(function() {return this.value;}).get(),true);
    assign_filter_options('severity_filter',$(".dt-severity").map(function() {return this.textContent;}).get(),true);
    assign_filter_options('priority_filter',$(".dt-priority").map(function() {return this.textContent;}).get(),true);
    assign_filter_options('component_filter',$(".dt-component").map(function() {return this.textContent;}).get(),true);
    assign_filter_options('status_filter',$(".dt-status").map(function() {return this.textContent;}).get(),true);
    assign_filter_options('releasedCode_filter',$(".dt-releasedCode").map(function() {return this.textContent;}).get(),true);
    assign_filter_options('director_filter',$(".dt-director").map(function() {return this.textContent;}).get(),true);
    assign_filter_options('manager_filter',$(".dt-manager").map(function() {return this.textContent;}).get(),true);
    assign_filter_options('engineer_filter',$(".dt-engineer").map(function() {return this.textContent;}).get(),true);

    let rne_list = $(".btn-rne-action").map(function() {
    if($(this).closest('tr').hasClass('offender')){return "RNE Offender"}
    else if(this.classList.contains('btn-view-rne')){return "RNE Available";}
    else{return "RNE Missing";}}).get();
    assign_filter_options('rne_filter',rne_list,true);
}
function resetFilters(){
    $('#rneqc_home_table > tbody  > tr').each(function(index, tr) {if(tr.classList.contains('hide-row')){tr.classList.remove("hide-row");tr.classList.add("show-row");}});
    setAllFilters();
    let i = 1;
    $('#rneqc_home_table > tbody  > tr:visible').each(function(index, tr) {
        tr.querySelector(".dynamic-row-count").textContent = String(i);i=i+1;
    });
    $('#span_bug_count').text(String(i-1));
    hidden_rows = {'status': [],'releasedCode':[],'component': [],'director': [],'manager': [],'engineer': [],'rneqcstatus': [],'priority': [],'severity': [],'rne': []};
    return true;
}

function updateRneqcStatusFilter() {
    let visible_rneqc_status = [];
    $('#rneqc_home_table > tbody  > tr:visible').each(function (index, tr) {
        visible_rneqc_status.push(tr.querySelector(".dt-rneqcstatus").value);
    });
    assign_filter_options('rneqcstatus_filter',visible_rneqc_status,true);
}

function updateRneFilter() {
    let rne_filter_data = $(".btn-rne-action").map(function() {
            if($(this).closest('tr').hasClass('offender')){return "RNE Offender"}
            else if(this.classList.contains('btn-view-rne')){return "RNE Available";}
            else{return "RNE Missing";}
        }).get();
    assign_filter_options('rne_filter',rne_filter_data,true);
}

async function setOffenderRows(){
    let data_releasedCode = $(".dt-releasedCode").map(function() {return this.textContent;}).get();
    $('#rneqc_home_table > tbody  > tr > .c-ver-found-rne > .view-rne-container').each(function(index, div) {
        let f = $(div).siblings('.rne-action-btn-container').children().hasClass('btn-view-rne');
        if(f){
            let pub_rest_data = $(div).children('span:first')[0].textContent;
            let bugid = $(div).closest('tr').attr('id');
            pub_rest_data = pub_rest_data.trim();
            if(pub_rest_data != ''){
             let flag1 = pub_rest_data.match("IGNORE|PREFCS");
             let flag2 = pub_rest_data.match("IGNORE-PSIRT");
             if(flag2 != null){flag1 = null;}
             if(flag1 != null && $('#releasedCode_'+bugid).text() == 'Y'){
                if($('#'+bugid).hasClass('offender')){}
                else {
                        $('#' + bugid).addClass('offender');
                        html = '<i><b>OFFENDER - </b> RNE Publication Restrictions: <b>IGNORE/PREFCS </b> and Released code: <b>Y</b></i>'
                        $('#offender-logic-' + bugid).append(html);
                }
             }
             else{
                if($('#'+bugid).hasClass('offender')){$('#'+bugid).removeClass('offender');}
             }
            }
        }
        else{
            let bugid = $(div).closest('tr').attr('id');
            if($('#releasedCode_'+bugid).text() == 'Y'){
                if($('#'+bugid).hasClass('offender')){}
                else {
                    $('#' + bugid).addClass('offender');
                    html = '<i><b>OFFENDER - </b> Missing RNE </b> and Released code: <b>Y</b></i>'
                    $('#offender-logic-' + bugid).append(html);
                }
             }
             else{
                if($('#'+bugid).hasClass('offender')){$('#'+bugid).removeClass('offender');}
             }
        }
    });
    return true
}


//function setRneStatistic(data_dict){
//    html = '<strong class="col-1">RNE</strong><div class="col-10 stats-badges-holder" id="rne_stat">';
//    mid_html = ''
//    for(const key in data_dict){
//        bd_color = 'blue'
//        if(key == 'RNE Available'){bd_color = 'green';}
//        else if(key == 'RNE Missing'){bd_color = 'yellow'}
//        else if(key == 'RNE Offender'){bd_color = 'red'}
//        mid_html = mid_html + '<span class="badge-'+ bd_color +' badge-parent btn-stat-badge"><span class="badge-child">'+data_dict[key]+'</span>'+ key +'</span>';
//    }
//    if($("#rne_stat").length) {
//        $("#rne_stat").html(mid_html);
//    }
//    else{$('#statistic_holder').append(html+mid_html+'</div>');}
//}

function setRneStatistic(data_dict){
    html = '<strong class="col-1">RNE</strong><div class="col-10 stats-badges-holder" id="rne_stat">';
    mid_html = ''
    for(const key in data_dict){
        bd_color = 'blue'
        if(key == 'RNE Available'){bd_color = 'green',hover_value = ' ';}
        else if(key == 'RNE Missing'){bd_color = 'yellow',hover_value = ' '}
        else if(key == 'RNE Offender'){bd_color = 'red',hover_value = 'Offender Bugs - Missing RNE or RNE Publication Restrictions:IGNORE/PREFCS and Released code: Y'}
        mid_html = mid_html + '<span class="badge-'+ bd_color +' badge-parent btn-stat-badge" title="' + hover_value + '"><span class="badge-child">'+data_dict[key]+'</span>'+ key +'</span>';
    }
    if($("#rne_stat").length) {
        $("#rne_stat").html(mid_html);
    }
    else{$('#statistic_holder').append(html+mid_html+'</div>');}
}


function setRneqcStatusStatistic(data_dict,flag_toggle_rne){
    html = '<strong class="col-1">RNEQC Status</strong><div class="col-11 stats-badges-holder" id="rneqc_stat">';
    mid_html = ''
    for(const key in data_dict){
        bd_color = 'blue'
        if(key == '----'){bd_color = 'red'}
        else if(key == 'RNEQC-excellent-RNE'){bd_color = 'sky'}
        else if(key == 'RNEQC-update-requested'){bd_color = 'yellow'}
        else if(key == 'RNEQC-updated'){bd_color = 'blue'}
        else if(key == 'RNEQC-review-completed'){bd_color = 'green';}
        mid_html = mid_html + '<span class="badge-'+ bd_color +' badge-parent btn-stat-badge"><span class="badge-child">'+data_dict[key]+'</span>'+ key +'</span>';
    }

    if($("#rneqc_stat").length) {
        $("#rneqc_stat").html(mid_html);
    }
    else{$('#statistic_holder').append(html+mid_html+'</div>');}
}

function get_all_rne_visible_data(){
    let flag = false;
    $(".view-rne-container").map(function() {
        if(this.classList.contains('show')){
        flag = true;
        }
    });
    return flag;
}

function update_rne_toggle_btn(){
    if(get_all_rne_visible_data()){
        if($('#btn_toggle_rne').hasClass('show-all')){$('#btn_toggle_rne').text('Hide All RNE');$('#btn_toggle_rne').removeClass('show-all');if($('#btn_expand_rne').hasClass('hide-this')){$('#btn_expand_rne').removeClass('hide-this');}}
    }
    else{if($('#btn_toggle_rne').hasClass('show-all')){}else{$('#btn_toggle_rne').text('Show All RNE');$('#btn_toggle_rne').addClass('show-all');if($('#btn_expand_rne').hasClass('hide-this')){}else{$('#btn_expand_rne').addClass('hide-this');}}}
}

$(document).ready(function(){
    setOffenderRows().then(setAllFilters());
    document.querySelectorAll(".display-notes-container.responsive").forEach(dom => {
            dom.style.height = `${dom.parentElement.offsetHeight - dom.offsetTop}px`;
            dom.style.maxHeight = `${dom.parentElement.offsetHeight - dom.offsetTop}px`;
    });

    $(document).on('click','.btn-stat-badge',function(){
        if($(this).closest('div').attr("id").split('_')[0] == 'rneqc'){
            if($('.btn-stat-badge').hasClass('clicked')){
                $('#rneqcstatus_filter').val('Default').trigger('change');
                $('.btn-stat-badge').removeClass('clicked');
            }
            else{
                let select_data = $(this).text().replace(/[0-9]/g,'');
                $('#rneqcstatus_filter').val(select_data).trigger('change');
                $('.btn-stat-badge').addClass('clicked');
            }
        }
        else{
            if($('.btn-stat-badge').hasClass('clicked')){
                $('#rne_filter').val('Default').trigger('change');
                $('.btn-stat-badge').removeClass('clicked');
            }
            else{
                let select_data = $(this).text().replace(/[0-9]/g,'');
                $('#rne_filter').val(select_data).trigger('change');
                $('.btn-stat-badge').addClass('clicked');
            }
        }
    });

    $(document).on('click','.btn_toggle_rne',function(){
        if($(this).hasClass('show-all')){
            console.log("Showing All RNE");console.log(new Date().getUTCMinutes());console.log(new Date().getUTCSeconds());
            $('#view-rows > tr').each(function() {
                let rne_holder = $(this).find('.view-rne-container');
                if($(rne_holder).hasClass('show')){}
                else{
                    let flag_rne_av = 0;
                    let bug_id = $(this).attr('id');
                    $('#show-rne-container-'+bug_id).addClass('show');
                    let obj = document.getElementById('rne-toggle-'+bug_id);
                    if(obj != null){obj.children[0].innerHTML = "Show";flag_rne_av = 1;}

                    if($('#display-notes-'+bug_id).hasClass('responsive')){}
                    else{
                        $('#display-notes-'+bug_id).addClass('responsive');
                        if($('#display-notes-'+bug_id).hasClass('empty-notes') && flag_rne_av == 0){$('#display-notes-'+bug_id).css({'height': '106px','maxHeight': '106px'});}
                        else{$('#display-notes-'+bug_id).css({'height': '156px','maxHeight': '156px'});}

                    }
                }
            });
            $('.btn_toggle_rne').removeClass('show-all');
            $('.btn_toggle_rne').text('Hide All RNE');
            console.log(new Date().getUTCMinutes());console.log(new Date().getUTCSeconds());
        }
        else{
            console.log("Hiding All RNE");console.log(new Date().getUTCMinutes());console.log(new Date().getUTCSeconds());
            $('#view-rows > tr').each(function() {
                let rne_holder = $(this).find('.view-rne-container');
                if($(rne_holder).hasClass('show')){
                    let bug_id = $(this).attr('id');
                    $('#show-rne-container-'+bug_id).removeClass('show');
                    let obj = document.getElementById('rne-toggle-'+bug_id);
                    if(obj != null){obj.children[0].innerHTML = "Show";}

                    if($('#display-notes-'+bug_id).hasClass('responsive')){
                        $('#display-notes-'+bug_id).removeClass('responsive');
                        $('#display-notes-'+bug_id).css({'height': '106px','maxHeight': '106px'});
                    }
                }

            });
            $('.btn_toggle_rne').addClass('show-all');
            $('.btn_toggle_rne').text('Show All RNE');
            console.log(new Date().getUTCMinutes());console.log(new Date().getUTCSeconds());
        }
    });

    $(document).on('click','.btn_expand_rne',function(){
        if($(this).hasClass('expanded')){
            document.querySelectorAll("#rneqc_home_table .c-ver-found-rne").forEach(dom => dom.style.width = "40%");
            document.querySelectorAll("#rneqc_home_table .warp-hide-lot").forEach(dom => dom.classList.remove("hide-this"));
            document.querySelectorAll("#fixed_table .warp-hide-lot").forEach(dom => dom.classList.remove("hide-this"));
            document.querySelectorAll("#fixed_table .c-ver-found-rne").forEach(dom => dom.style.width = "40%");
            $('.btn_expand_rne').removeClass('expanded');$('.btn_expand_rne').text('Expand All RNE');
        }
        else{
            document.querySelectorAll("#rneqc_home_table .c-ver-found-rne").forEach(dom => dom.style.width = "60%");
            document.querySelectorAll("#rneqc_home_table .warp-hide-lot").forEach(dom => dom.classList.add("hide-this"));
            document.querySelectorAll("#fixed_table .warp-hide-lot").forEach(dom => dom.classList.add("hide-this"));
            document.querySelectorAll("#fixed_table .c-ver-found-rne").forEach(dom => dom.style.width = "60%");
            $('.btn_expand_rne').addClass('expanded');$('.btn_expand_rne').text('Shrink All RNE');
        }
    });

});

