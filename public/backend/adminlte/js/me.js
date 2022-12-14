$(document).ready(function () {
    var ckbAll = $(".cbAll");
    var fmAdmin = $("#zt-form");

    // CKEDITOR
    
	CKEDITOR.replace( 'id_content' );


    //call active menu
    activeMenu();

    //check selectbox
    change_form_action("#zt-form .slbAction", "#zt-form","#btn-action");

    //check all
    ckbAll.click(function () {
        $('input:checkbox').not(this).prop('checked', this.checked);
        if ($(this).is(':checked')) {
            $(".ordering").attr("name", "ordering");
        }else{
           
            $(".ordering").removeAttr("name");
        }
        
    });
    // hiden notify
    hiddenNotify(".close-btn");



    $("input[name=cid]").click(function () {
        if ($(this).is(':checked')) {
            $(this).parents("tr").find('.ordering').attr("name", "ordering");
        }else{
            $(this).parents("tr").find('.ordering').removeAttr("name");
        }
    });
    
    // CONFIRM DELETE
    $('a.btn-delete').on('click', () => {
        if (!confirm("Are you sure you want to delete this item?")) return false;
    });

    //active menu function
    function activeMenu() {
        let pathname = window.location.pathname;
        let arrMenu = pathname.split("/");
        let currentMenu = arrMenu[2];
        $('li.nav-item a[data-active="'+currentMenu+'"]').addClass('my-active');
    }

    //
    function change_form_action(slb_selector, form_selector, id_btn_action) {

        var optValue;
        var isDelete = false;
        var pattenCheckDelete = new RegExp("delete", "i");

        $(slb_selector).on("change", function () {
            optValue = $(this).val();
            
            
            if(optValue !== "") {
                $(id_btn_action).removeAttr('disabled');
            } else {
                $(id_btn_action).attr('disabled', 'disabled');
            }
            $(form_selector).attr("action", optValue);
        });

        $(form_selector + " .btnAction").on("click", function () {
            isDelete = pattenCheckDelete.test($(slb_selector).val());
            if(isDelete){
                var confirmDelete = confirm('Are you really want to delete?');
                if(confirmDelete === false){
                    return;
                }
            }

            var numberOfChecked = $(form_selector + ' input[name="cid"]:checked').length;
            if (numberOfChecked == 0) {
                alert("Please choose some items");
                return;
            } else {
                var flag = false;
                var str = $(slb_selector + " option:selected").attr('data-comfirm');
               
                if (str != undefined) {

                    //Ki???m tra gi?? tr??? tr??? v??? khi user nh???n n??t tr??n popup
                    flag = confirm(str);
                    if (flag == false) {
                        return flag;
                    } else {
                        $(form_selector).submit();
                    }

                } else {
                    if (optValue != undefined) {
                        $(form_selector).submit();
                    }
                }
            }

        });
    }

    // hidden parent (hidden message notify)
    function hiddenNotify(close_btn_selector){
        $(close_btn_selector).on('click', function(){
            $(this).parent().css({'display':'none'});
        })    
    }
    /// tr hop choose groups
    $('select[name="groups_id"]').change(function(){
        $('input[name="groups_name"]').val($(this).find('option:selected').text());
    });

    $('select[name="filter-groups"]').change(function(){
        let path = window.location.pathname.split('/');
        let linkRedirect = '/' + path[1] + '/' + path[2] + '/filter-groups/' + $(this).val();
        
            window.location.pathname =  linkRedirect ;
       
    });


    function change_alias(alias) {

    let str = alias;

    //?????i ch??? hoa th??nh ch??? th?????ng
    str = str.toLowerCase();
 
    //?????i k?? t??? c?? d???u th??nh kh??ng d???u
    str = str.replace(/??|??|???|???|??|??|???|???|???|???|???|??|???|???|???|???|???/gi, 'a');
    str = str.replace(/??|??|???|???|???|??|???|???|???|???|???/gi, 'e');
    str = str.replace(/i|??|??|???|??|???/gi, 'i');
    str = str.replace(/??|??|???|??|???|??|???|???|???|???|???|??|???|???|???|???|???/gi, 'o');
    str = str.replace(/??|??|???|??|???|??|???|???|???|???|???/gi, 'u');
    str = str.replace(/??|???|???|???|???/gi, 'y');
    str = str.replace(/??/gi, 'd');
    //X??a c??c k?? t??? ?????t bi???t
    str = str.replace(/\`|\~|\!|\@|\#|\||\$|\%|\^|\&|\*|\(|\)|\+|\=|\,|\.|\/|\?|\>|\<|\'|\"|\:|\;|_/gi);
    //?????i kho???ng tr???ng th??nh k?? t??? g???ch ngang
    str = str.replace(/ /gi,"-");
    //?????i nhi???u k?? t??? g???ch ngang li??n ti???p th??nh 1 k?? t??? g???ch ngang
    //Ph??ng tr?????ng h???p ng?????i nh???p v??o qu?? nhi???u k?? t??? tr???ng
    str = str.replace(/\-\-\-\-\-/gi,'-');
    str = str.replace(/\-\-\-\-/gi,'-');
    str = str.replace(/\-\-\-/gi,'-');
    str = str.replace(/\-\-/gi,'-');
    //X??a c??c k?? t??? g???ch ngang ??? ?????u v?? cu???i
    str = '@' + str + '@';
    str = str.replace(/\@\-|\-\@|\@/gi,'');
    str = str.trim();
    return str;
}

    $(document).ready(function() {
        var ckAll = $(".cbAll");
    });

    $(`input#name_slug`).keyup(function(){
        $('input[name="slug"]').val(change_alias($(this).val()));
    });

    $(`input#items_slug`).keyup(function(){
        $('input[name="slug"]').val(change_alias($(this).val()));
    });

    $("form[name=form-upload]").submit(function(event) {
        let avatar = $(this).find("input[name=avatar]");
        $(this).find("input[name=avatar]").remove();
        $(this).append(avatar).css({'display':'none'});
    });



});
