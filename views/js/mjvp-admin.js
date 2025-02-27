$(document).ready(function () {

    // Venipak Orders page modal handling.
    $(document).on('click', '.change-shipment-modal', function(e) {
        e.preventDefault();
        mijoraVenipak.createOrderModal();
    });

    $('.track-orders').on('click', function(e) {
        e.preventDefault();
        let order = null;
        let target = $(e.target);
        if(target.data('id-order'))
            order = target.data('id-order');
        else if(target.parent().data('id-order'))
            order = target.parent().data('id-order');
        if(order)
            mijoraVenipak.createTrackingModal(order);
        else
            mijoraVenipak.trackOrders();
    });

    // Configuration page
    if($('#MJVP_COURIER_DELIVERY_TIME_on').is(':checked'))
        $('.delivery-checkbox').removeClass('hide');
    $('#MJVP_COURIER_DELIVERY_TIME_on, #MJVP_COURIER_DELIVERY_TIME_off').on('change', () =>{
        if($('#MJVP_COURIER_DELIVERY_TIME_on').is(':checked'))
            $('.delivery-checkbox').removeClass('hide');
        else
            $('.delivery-checkbox').addClass('hide');
    });

    if($('#MJVP_RETURN_SERVICE_on').is(':checked'))
        $('.return-days').removeClass('hide');
    $('#MJVP_RETURN_SERVICE_on, #MJVP_RETURN_SERVICE_off').on('change', () =>{
        if($('#MJVP_RETURN_SERVICE_on').is(':checked'))
            $('.return-days').removeClass('hide');
        else
            $('.return-days').addClass('hide');
    });

    // Admin order JavaScript
    if ($('#venipak_order_form').length != 0)
    {
        mijoraVenipak.bindOrderFormEvents();
    }

    // Manifest close modal.
    $('.close-manifest').on('click', () => {
        event.preventDefault();
        var target = $(event.target);
        confirm_modal(
            "Close manifest",
            "Do you want to close and print this manifest?",
            "Yes",
            "Cancel",
            () => {
                document.location = $(target).attr('href');
            },
            () => {}
        );

    });
});

window.mijoraVenipak = {
    showResponse: function(msg, type) {
        $('.venipak .response').removeClass('alert-danger alert-success');
        $('.venipak .response').addClass('alert-' + type);

        if($('.venipak .response').find('ol').length == 0)
            $('.venipak .response').append('<ol></ol>');

        // Clean html tags
        if(Array.isArray(msg))
            msg = msg[0];
        msg = msg.replace(/<(?!\/?(i|b)\b)[^>]+>/g, "");
        $('.venipak .response').find('ol').addClass('mb-0').append(`<li>${msg}</li>`);
        $('.venipak .response').show();
    },

    enableButtons: function() {
        $('#venipak_save_cart_info_btn').removeAttr('disabled');
        $('#venipak_generate_label_btn').removeAttr('disabled');
    },

    disableButtons: function() {
        $('#venipak_save_cart_info_btn').attr('disabled', true);
        $('#venipak_generate_label_btn').attr('disabled', true);
    },

    addOverlay: function() {
        this.removeOverlay();
        $('body').append(`
            <div id="vp-loading-overlay">
                <div class="lds-ellipsis">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
            </div>`
        );
    },

    removeOverlay: function() {
        $('#vp-loading-overlay').remove();
    },

    generateVenipakLabel: function() {
        var form_data = $('#venipak_order_form').serializeArray();
        form_data.push({'name' : 'ajax', 'value' : 1});
        form_data.push({'name' : 'id_order', 'value' : order_id});
        $('.venipak .response').html('').removeClass('alert-success');
        this.disableButtons();
        $.ajax({
            type: "POST",
            url: venipak_generate_label_url,
            data: form_data,
            success: function (res) {
                res = JSON.parse(res);
                if (typeof res.errors != 'undefined') {
                    if(Array.isArray(res.errors))
                    {
                        res.errors.forEach((error) => {
                            mijoraVenipak.showResponse(error, 'danger');
                        });
                    }
                    else
                    {
                        mijoraVenipak.showResponse(res.errors, 'danger');
                    }
                    return false;
                } else {
                    mijoraVenipak.showResponse(res.success, 'success');
                    location.reload();
                }
            },
            complete: function(jqXHR, status) {
                mijoraVenipak.enableButtons();
            }
        });
    },

    enableExtraInfo: function() {
        document.getElementById('venipak-packs').disabled = false;
        $('#venipak-cod').removeAttr('disabled');
        $('.venipak .extra-services-container').show();
    },

    togglePickupPoints: function() {
        if ($('#venipak-carrier').val() == pickup_reference) {
            $('.pickup-point-container').show();
            $('.venipak .extra-services-container').hide();
        } else {
            $('.pickup-point-container').hide();
            this.enableExtraInfo();
        }
    },

    saveVenipakCart: function() {
        var form_data = $('#venipak_order_form').serializeArray();
        form_data.push({'name' : 'ajax', 'value' : 1});
        form_data.push({'name' : 'id_order', 'value' : order_id});
        $('.venipak .response').html('').removeClass('alert-success');
        this.disableButtons();
        $.ajax({
            type: "POST",
            url: venipak_save_order_url,
            dataType: "json",
            data: form_data,
            success: function (res) {
                if (typeof res.errors != 'undefined') {
                    mijoraVenipak.showResponse(res.errors, 'danger');
                } else {
                    mijoraVenipak.showResponse(res.success[0], 'success');
                    // Do not reload if modal
                    if(!currentIndex.includes('AdminVenipakShipping'))
                        window.location.href = location.href;
                }
            },
            complete: function (jqXHR, status) {
                mijoraVenipak.enableButtons();
            }
        });
    },

    warning: function(text) {
        if (!!$.prototype.fancybox) {
            $.fancybox.open([
                    {
                        type: 'inline',
                        autoScale: true,
                        minHeight: 30,
                        content: '<p class="fancybox-error">' + text + '</p>'
                    }],
                {
                    padding: 0
                });
        } else {
            alert(text);
        }
    },

    createOrderModal: function() {
        var link;
        if(event.target.tagName == 'I')
            link = $(event.target.parentElement);
        else
            link = $(event.target);

        var id_order = link.data('order');
        if($('#vp-order-modal-wrapper').length != 0)
        {
            $('#venipak-modal-order').modal('hide');
            $('#vp-order-modal-wrapper').remove();
        }
        this.addOverlay();
        $.ajax({
            type: "POST",
            url: venipak_prepare_modal_url,
            data: {
                'id_order' : id_order
            },
            success: function (res) {
                res = JSON.parse(res);
                if (typeof res.errors != 'undefined') {
                    if(Array.isArray(res.errors))
                    {
                        res.errors.forEach((error) => {
                            mijoraVenipak.showResponse(error, 'danger');
                        });
                    }
                    else
                    {
                        mijoraVenipak.showResponse(res.errors, 'danger');
                    }
                    return false;
                } else if(res.modal){
                    $('#form-order').append(res.modal);
                }
            },
            complete: function(jqXHR, status) {
                mijoraVenipak.enableButtons();
                $('#venipak-modal-order').modal('show');
                mijoraVenipak.bindOrderFormEvents();
                mijoraVenipak.removeOverlay();
            }
        });
    },

    trackOrders: function() {
        this.addOverlay();
        if($('#vp-tracking-modal-wrapper').length != 0)
        {
            $('#venipak-modal-tracking').modal('hide');
            $('#vp-tracking-modal-wrapper').remove();
        }
        $.ajax({
            type: "POST",
            url: venipak_tracking_url,
            success: function (res) {
                res = JSON.parse(res);
                if (typeof res.errors != 'undefined') {
                    if(Array.isArray(res.errors))
                    {
                        res.errors.forEach((error) => {
                            mijoraVenipak.showResponse(error, 'danger');
                        });
                    }
                    else
                    {
                        mijoraVenipak.showResponse(res.errors, 'danger');
                    }
                    return false;
                } else if(typeof res.success != 'undefined'){
                    mijoraVenipak.removeOverlay();
                    showSuccessMessage(res.success);
                    document.location.reload();
                } else if(typeof res.warning != 'undefined'){
                    mijoraVenipak.removeOverlay();
                    showErrorMessage(res.warning);
                }

            },
            complete: function(jqXHR, status) {
                mijoraVenipak.removeOverlay();
            }
        });
    },

    createTrackingModal: function(order) {
        this.addOverlay();
        if($('#vp-tracking-modal-wrapper').length != 0)
        {
            $('#venipak-modal-tracking').modal('hide');
            $('#vp-tracking-modal-wrapper').remove();
        }
        $.ajax({
            type: "POST",
            url: venipak_tracking_url,
            data : {
                'id_order' : order
            },
            success: function (res) {
                res = JSON.parse(res);
                if (typeof res.errors != 'undefined') {
                    if(Array.isArray(res.errors))
                    {
                        res.errors.forEach((error) => {
                            mijoraVenipak.showResponse(error, 'danger');
                        });
                    }
                    else
                    {
                        mijoraVenipak.showResponse(res.errors, 'danger');
                    }
                    return false;
                } else if(res.modal){
                    $('#form-order').append(res.modal);
                }
            },
            complete: function(jqXHR, status) {
                mijoraVenipak.enableButtons();
                $('#venipak-modal-tracking').modal('show');
                mijoraVenipak.removeOverlay();
            }
        });
    },

    bindOrderFormEvents: function() {
        var cod_amount = document.getElementById(`venipak-cod-amount`);
        var $pickup_points = $(`.venipak select[name="id_pickup_point"]`);
        var cod = $('#venipak-cod');

        cod_amount.disabled = cod.val() == '0';
        this.togglePickupPoints();
        $('.venipak .response').hide();

        cod.on('change', function(e){
            cod_amount.disabled = cod.val() == '0';
        });
        $('#venipak-carrier').on('change', function(e){
            mijoraVenipak.togglePickupPoints();
        });

        $('#venipak_save_cart_info_btn').on('click', function(e){
            e.preventDefault();

            if ($('#venipak-carrier').val() == '1' && $pickup_points.val() == 0) {
                mijoraVenipak.warning(terminal_warning);
                return false;
            }
            mijoraVenipak.saveVenipakCart();
        });

        $('#venipak_generate_label_btn').on('click', function(e){
            e.preventDefault();
            mijoraVenipak.generateVenipakLabel();
        });
    }
};
