let products = {
    // PRODUCTS LIST
    list : {
      1 : { name:"VANS", img:"shoe-001.a.jpg", price: 16.51 },
      2 : { name:"CONVERT", img:"shoe-002.a.jpg", price: 25.99 },
      3 : { name:"ADDIDAS", img:"shoe-003.a.jpg", price: 28.98 },
      4 : { name:"NIKE", img:"shoe-004.a.jpg", price: 16.40 },
      5 : { name:"ADDIDAS", img:"shoe-003.b.jpg", price: 28.98 },
      6 : { name:"NIKE", img:"shoe-004.b.jpg", price: 16.40 }
    },
  
    // DRAW HTML PRODUCTS LIST
    draw : function () {
      // TARGET WRAPPER
      var wrapper = document.getElementById("poslist");
  
      // CREATE PRODUCT HTML
      for (let pid in products.list) {
        // CURRENT PRODUCT
        let p = products.list[pid],
            pdt = document.createElement("div"),
            segment;
  
        pdt.className = "pwrap";
        pdt.dataset.pid = pid;
        pdt.onclick = cart.add;
        wrapper.appendChild(pdt);
  
        // IMAGE
        segment = document.createElement("img");
        segment.className = "pimg";
        segment.src = "images/" + p.img;
        pdt.appendChild(segment);
  
        // NAME
        segment = document.createElement("div");
        segment.className = "pname";
        segment.innerHTML = p.name;
        pdt.appendChild(segment);
  
        // PRICE
        segment = document.createElement("div");
        segment.className = "pprice";
        segment.innerHTML = "$" + p.price;
        pdt.appendChild(segment);
      }
    }
  };
  window.addEventListener("DOMContentLoaded", products.draw);
  
  let cart = {
    // PROPERTIES
    items : {}, // CURRENT ITEMS IN CART
  
    // SAVE CURRENT CART INTO LOCALSTORAGE
    save : function () {
      localStorage.setItem("cart", JSON.stringify(cart.items));
    },
  
    // LOAD CART FROM LOCALSTORAGE
    load : function () {
      cart.items = localStorage.getItem("cart");
      if (cart.items == null) { cart.items = {}; }
      else { cart.items = JSON.parse(cart.items); }
    },
  
    nuke : function () {
      cart.items = {};
      localStorage.removeItem("cart");
      cart.list();
    },
  
    // INITIALIZE - RESTORE PREVIOUS SESSION
    init : function () {
      cart.load();
      cart.list();
    },
  
    // LIST CURRENT CART ITEMS (IN HTML)
    list : function () {
      let wrapper = document.getElementById("poscart"),
          item, part, pdt,
          total = 0, subtotal = 0,
          empty = true;
      wrapper.innerHTML = "";
      for (let key in cart.items) {
        if (cart.items.hasOwnProperty(key)) { empty = false; break; }
      }
  
      // CART IS EMPTY
      if (empty) {
        item = document.createElement("div");
        item.innerHTML = "Your Product list here!"; // ADD TO CARD
        wrapper.appendChild(item);
      }
  
      // CART IS NOT EMPTY - LIST ITEMS
      else {
        for (let pid in cart.items) {
          // CURRENT ITEM
          pdt = products.list[pid];
          item = document.createElement("div");
          item.className = "citem";
          wrapper.appendChild(item);
  
          // ITEM NAME
          part = document.createElement("span");
          part.innerHTML = pdt.name;
          part.className = "cname";
          item.appendChild(part);
  
          // REMOVE
          part = document.createElement("input");
          part.type = "button";
          part.value = "x";
          part.dataset.pid = pid;
          part.className = "cdel";
          part.addEventListener("click", cart.remove);
          item.appendChild(part);
  
          // QUANTITY
          part = document.createElement("input");
          part.type = "number";
          part.min = 0;
          part.value = cart.items[pid];
          part.dataset.id = pid;
          part.className = "cqty";
          part.addEventListener("change", cart.change);
          item.appendChild(part);
  
          // SUBTOTAL
          subtotal = cart.items[pid] * pdt.price;
          total += subtotal;
        }
  
        // TOTAL AMOUNT
        item = document.createElement("div");
        item.className = "ctotal";
        item.id = "ctotal";
        item.innerHTML ="TOTAL: $" + total;
        wrapper.appendChild(item);
  
        // EMPTY BUTTON
        item = document.createElement("input");
        item.type = "button";
        item.value = "Empty";
        item.addEventListener("click", cart.nuke);
        item.id = "cempty";
        wrapper.appendChild(item);
  
        // CHECKOUT BUTTON
        item = document.createElement("input");
        item.type = "button";
        item.value = "Checkout";
        item.addEventListener("click", cart.checkout);
        item.id = "ccheckout";
        wrapper.appendChild(item);
      }
    },
  
    // ADD ITEM TO CART
    add : function () {
      let pid = this.dataset.pid;
      if (cart.items[pid] == undefined) { cart.items[pid] = 1; }
      else { cart.items[pid]++; }
      cart.save(); cart.list();
    },
  
    // CHANGE QUANTITY
    change : function () {
      // REMOVE ITEM
      let pid = this.dataset.pid;
      if (this.value <= 0) {
        delete cart.items[pid];
        cart.save(); cart.list();
      }
  
      // UPDATE TOTAL ONLY
      else {
        cart.items[pid] = this.value;
        let total = 0;
        for (let id in cart.items) {
          total += cart.items[pid] * products.list[pid].price;
          document.getElementById("ctotal").innerHTML ="TOTAL: $" + total;
        }
      }
    },
  
    // REMOVE ITEM FROM CART
    remove : function () {
      confirm("Are you want to delete?");
      delete cart.items[this.dataset.pid];
      cart.save(); cart.list();
    },
  
    // CHECKOUT
    checkout : function () {
      confirm("Completed! Would you like to print a receit?");
      orders.print();
      orders.add();
    }
  };
  window.addEventListener("DOMContentLoaded", cart.init);
  
  let orders = {
    // PROPERTY
    idb : window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB,
    posdb : null,
    db : null,
  
    init : function () {
      if (!orders.idb) {
        alert("INDEXED DB IS NOT SUPPORTED ON THIS BROWSER!");
        return false;
      }
  
      orders.posdb = orders.idb.open("JSPOS", 1);
      orders.posdb.onsuccess = function () {
        orders.db = orders.posdb.result;
      };
  
      orders.posdb.onupgradeneeded = function () {
        let db = orders.posdb.result,
        store = db.createObjectStore("Orders", {keyPath: "oid", autoIncrement: true}),
        index = store.createIndex("time", "time");
  
        // ORDER ITEMS STORE (TABLE)
        store = db.createObjectStore("Items", {keyPath: ["oid", "pid"]}),
        index = store.createIndex("qty", "qty");
      };

      orders.posdb.onerror = function (err) {
        alert("ERROR CREATING DATABASE!");
        console.log(err);
      };
    },
  
    // ADD NEW ORDER
    add : function () {
      // INSERT ORDERS STORE (TABLE)
      let tx = orders.db.transaction("Orders", "readwrite"),
          store = tx.objectStore("Orders"),
          req = store.put({time: Date.now()});
  
      let size = 0, entry;
      for (entry in cart.items) {
        if (cart.items.hasOwnProperty(entry)) { size++; }
      }
  
      // INSERT ITEMS STORE (TABLE)
      entry = 0;
      req.onsuccess = function (e) {
        tx = orders.db.transaction("Items", "readwrite"),
        store = tx.objectStore("Items"),
        oid = req.result;
        for (let pid in cart.items) {
          req = store.put({oid: oid, pid: pid, qty: cart.items[pid]});
  
          // EMPTY CART ONLY AFTER ALL ENTRIES SAVED
          req.onsuccess = function () {
            entry++;
            if (entry == size) { cart.nuke(); }
          };
        }
      };
    },
  
    // PRINT RECEIPT FOR CURRENT ORDER
    print : function () {
      // GENERATE RECEIPT
      let wrapper = document.getElementById("posreceipt");
      wrapper.innerHTML = "";
      for (let pid in cart.items) {
        let item = document.createElement("div");
        item.innerHTML = `${cart.items[pid]} X ${products.list[pid].name}`;
        wrapper.appendChild(item);
      }
  
      // PRINT
      let printwin = window.open();
      printwin.document.write(wrapper.innerHTML);
      printwin.stop();
      printwin.print();
      printwin.close();
    }
  };
  window.addEventListener("DOMContentLoaded", orders.init);


// WORKING ON JQUERY! ======================================

$(document).ready(function() {

  $("#hide").click(function(){
    $(".blog").toggle();
      $(".article_1").toggle();
        $(".under-line").toggle();
  });


//ANIMATION!
  $("#wipeOut").click(function(){
    $(".blog").css("background", "#eee")
    .slideUp(2000)
    .slideDown(2000); 
  });


  $("#hover").hover(function(){
    $(".dropdown").slideToggle();
    });
  
// ACCORDION DROPDOWN HOVERED ANIMATION! 
$("#accordion > li > div").on({
    mouseenter: function(){

    if(false == $(this).next().is(':visible')) {
        $('#accordion ul').slideUp(1000);
    }
    },

    mouseover: function() {
    $(this).next().slideToggle(1000);

    },
  });

    $('#accordion ul:eq(0)').hide();


});