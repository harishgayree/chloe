(function () {
  if (document.location.href.indexOf('vat_id_error_country=true') != -1) {
    document.getElementsByClassName('vat_id_error_country')[0].style.display = 'block';
  }

  if (document.location.href.indexOf('vat_id_error_invalid=true') != -1) {
    document.getElementsByClassName('vat_id_error_invalid')[0].style.display = 'block';
  }

  const cartVatIdField = document.getElementsByClassName('cart_vat_id')[0];

  if (cartVatIdField !== undefined) {
    cartVatIdField.addEventListener('change', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  }

  const getPath = function (action) {
    const a = document.createElement('a');
    a.href = action;
    return a.pathname;
  };

  const isCheckoutButton = function (target) {
    if (target.form) {
      const action = target.form.getAttribute('action');
      if (action.search(/^\/checkout\b/) !== -1) {
        return true;
      }
      if (action.search(/^\/cart\b/) !== -1 && target.getAttribute('name') === 'checkout') {
        return true;
      }
      if (action.search(/\/[a-zA-Z]{2}(\-[a-zA-Z]{2})?\/cart/) !== -1 && target.getAttribute('name') === 'checkout') {
        return true;
      }
      const path = getPath(action);
      if (path.search(/^\/checkout\b/) !== -1) {
        return true;
      }
      if (path.search(/^\/cart\b/) !== -1 && target.getAttribute('name') === 'checkout') {
        return true;
      }
      if (path.search(/\/[a-zA-Z]{2}(\-[a-zA-Z]{2})?\/cart/) !== -1 && target.getAttribute('name') === 'checkout') {
        return true;
      }
    }
    return false;
  };

  const getVatId = function (target) {
    const inputs = target.form.getElementsByTagName('input');
    for (let i = 0, l = inputs.length; i < l; i++) {
      if (inputs[i].name == 'attributes[vat_id]') {
        return inputs[i].value.toUpperCase();
      }
    }
  };

  const setVatId = function (target, value) {
    const inputs = target.form.getElementsByTagName('input');
    for (let i = 0, l = inputs.length; i < l; i++) {
      if (inputs[i].name == 'attributes[vat_id]') {
        inputs[i].value = value;
      }
    }
  };

  const submitForm = function (form) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'checkout';
    form.appendChild(input);
    form.submit();
  };

  const addItemToForm = function (item, form) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'latoriapps-tem-item[]';
    input.value = JSON.stringify(item);
    form.appendChild(input);
  };

  document.addEventListener('click', (event) => {
    // target
    let { target } = event;
    if (event.target.form == undefined) {
      target = event.target.parentElement;
    }

    if (isCheckoutButton(target)) {
      // error messages
      const vat_id_error_country = target.form.getElementsByClassName('vat_id_error_country')[0];
      const vat_id_error_invalid = target.form.getElementsByClassName('vat_id_error_invalid')[0];
      vat_id_error_country.style.display = 'none';
      vat_id_error_invalid.style.display = 'none';

      // form
      const { form } = target;

      // get VAT ID
      const vatId = getVatId(target);
      if (vatId.length == 0) {
        return;
      }

      // no valid length? => show error message
      if (vatId.length < 4 || vatId.length > 15) {
        vat_id_error_invalid.style.display = 'block';
        event.preventDefault();
        return;
      }

      // not starting with 2 letters? => show error message
      if (vatId.match(/\D{2}/i) == null) {
        vat_id_error_invalid.style.display = 'block';
        event.preventDefault();
        return;
      }

      // same country? => show error message
      if (vatId.indexOf('AU') == 0) {
        vat_id_error_country.style.display = 'block';
        setVatId(target, '');
        event.preventDefault();
        return;
      }

      // prevent normal form submit
      event.preventDefault();

      // add current items to cart form afterwards submit to latori tem app to create a draft order
      const xhr = new XMLHttpRequest();
      xhr.open('GET', '/cart.js');
      xhr.onload = function () {
        if (xhr.status === 200) {
          const cart = JSON.parse(xhr.responseText);
          if (cart.items.length > 0) {
            for (let i = 0, l = cart.items.length; i < l; i++) {
              addItemToForm(cart.items[i], form);
            }
            form.action = 'https://tax-exempt-manager-2.herokuapp.com/draft_order/create?shop=jshealthstore.myshopify.com';
            form.submit();
          }
        } else {
          submitForm(form);
        }
      };
      xhr.send();
    }
  });
}());
