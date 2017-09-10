webpackJsonp([20],{710:function(t,a,n){"use strict";(function(t){function a(t){return 27+(t<=100?3*t:300+t-100)}function n(t){return 12+(t<=100?0:Math.floor((t-100)/20)+1)}function e(t,a){if(a=a||0,isNaN(t))return"?";if(t===1/0||t===-(1/0))return"∞";var n=t.toFixed(a).split("."),e=parseInt(n[0]);return e.toLocaleString()+(1===n.length?"":"."+n[1])}function i(){if(I){var a=t("#map").find("tbody tr input[name=num_drops]").map(function(){return parseInt(t(this).val())||0}).toArray().reduce(function(t,a){return t+a},0);t("input[name=current]").val(a).trigger("change")}}function o(){var a={};try{a=JSON.parse(t.cookie(M)),void 0===a.version&&(a.version=1)}catch(t){console.warn(t)}return t.extend(!0,j,a)}function r(a){t.cookie(M,JSON.stringify(a),{expires:30})}function s(){if(y){var a=45,n=7,e=parseInt(t("[name=current]:input").val()),i=t("#rewards tbody");i.find("tr").removeClass("active").each(function(){var i=t(this),o=i.attr("data-amount")-e;if(o<-a)i.hide();else if(o<0)i.css("opacity",.5).show();else if(o<a)i.addClass("active").css("opacity",1).show();else if(o<a*n){var r=1-Math.floor(o/a)*a/(a*(n+1));i.show().css("opacity",r)}else i.hide();var s=0===o?"diff-eq":o>0?"diff-plus":"diff-minus",c=0===o?"":(o>0?"+":"")+o;i.find("span.diff").removeClass("diff-eq diff-plus diff-minus").addClass(s).text(c)})}}function c(){if("exchange"===_){var a=parseInt(t("[name=current]:input").val());b.forEach(function(n){for(var e=t('[data-prize="'+n.unit+'"]').empty(),i=0;i<a;i+=n.value){var o=t("<i />").addClass("icon icon-"+n.unit),r=25*Math.min(a-i,n.value)/n.value;t('<div class="prize-gage" />').append(o.clone().css({position:"absolute",opacity:.2,boxShadow:"none",paddingRight:25-r})).append(o.clone().css({width:r+"px"})).appendTo(e)}})}}function u(){var a=t("[name=expectation]:input").val(),n=1/0,i=0,o="drop"===a?null:a,r=g.map(function(t){var a=t.expectation/(o&&t[o]||1);return n=0,i=Math.max(i,a),a}),s=o?3:2;g.forEach(function(a,o){var c=t("[data-chart="+o+"]"),u=r[o],p=u/(i-n),m=120*p+240;c.find("span.barchart-label").text(e(u,s)+"個"),c.find("span.barchart").css({width:100*p+"%",backgroundColor:"hsla("+m+", 80%, 50%, 0.5)"})})}function p(){var a=parseInt(t("[name=objective]:input").val()),n=parseInt(t("[name=current]:input").val()),i=Math.max(a-n,0);g.forEach(function(a,n){var o=t("[data-chart="+n+"]"),r=i?Math.ceil(i/a.expectation):0;o.find("span.marathon").text("残り"+e(r)+"周")})}function m(){var i=parseInt(t("[name=current]:input").val()),o=parseInt(t("[name=objective]:input").val()),r=g[parseInt(t("[name=estimate_map]:input").val())],s=Math.max(o-i,0),c=Math.ceil(s/r.expectation);t("#estimate_required_marathon").text(e(c));var u=(new Date).getTime(),p=v.reduce(function(t,a){return t+Math.max(a[1],u)-Math.max(a[0],u)},0),m=0+t("[name=estimate_natural_recovery]:input").prop("checked"),l=Math.floor(p/18e4)*m,d=Math.floor(p/36e5)*m,f=parseInt(t("[name=estimate_rank]").val()),h=a(f),b=n(f),x=Math.ceil(r.charisma*c),_=Math.ceil(r.stamina*c),k=t("[name=estimate_use_crystal]:input").val(),y=0+("both"===k||"charisma"===k),M=0+("both"===k||"stamina"===k),w=y?x:l,C=M?_:d,I=Math.floor(Math.min(w/r.charisma,C/r.stamina));t("#estimate_available_marathon").text(e(I));var j=Math.ceil(Math.max(r.charisma*I-l,0)/h),T=Math.ceil(Math.max(r.stamina*I-d,0)/b),E=j+T;t("#estimate_required_crystal").text(e(E));var D=0===j?"diff-eq":j>0?"diff-plus":"diff-minus";t("#estimate_required_crystal_for_charisma").attr("class",D).text(e(j)),D=0===T?"diff-eq":T>0?"diff-plus":"diff-minus",t("#estimate_required_crystal_for_stamina").attr("class",D).text(e(T));var q=I-c;D=0===q?"diff-eq":q>0?"diff-plus":"diff-minus";var z=(q>=0?"+":"")+e(q);t("#estimate_available_marathon_diff").attr("class",D).text(z);var N=r.charisma*I;t("#estimate_using_charisma").text(e(N)),q=N-x,D=0===q?"diff-eq":q>0?"diff-plus":"diff-minus",z=(q>=0?"+":"")+e(q),t("#estimate_using_charisma_diff").attr("class",D).text(z);var R=Math.ceil(r.stamina*I);t("#estimate_using_stamina").text(e(R)),q=R-_,D=0===q?"diff-eq":q>0?"diff-plus":"diff-minus",z=(q>=0?"+":"")+e(q),t("#estimate_using_stamina_diff").attr("class",D).text(z);var S=i+Math.floor(r.expectation*I);t("#estimate_result_collection").text(e(S)),q=S-o,D=0===q?"diff-eq":q>0?"diff-plus":"diff-minus",z=(q>=0?"+":"")+e(q),t("#estimate_result_collection_diff").attr("class",D).text(z)}function l(){var a=parseInt(t("[name=current]:input").val()),n=parseInt(t("[name=objective]:input").val()),i=(new Date).getTime(),o=v.reduce(function(t,a){return t+Math.max(a[1],i)-Math.max(a[0],i)},0),r=Math.max(n-a,0),s=o/864e5,c=r/Math.max(s,1),u=o/36e5,p=r/Math.max(u,1),m=o/18e5,l=r/Math.max(m,1),d=e(c,3).split(".");t("#norma_per_day").find(".norma-amount-actual").text(d[0]).parent().find(".norma-amount-fraction").text("."+d[1]).parent(),d=e(p,3).split("."),t("#norma_per_hour").find(".norma-amount-actual").text(d[0]).parent().find(".norma-amount-fraction").text("."+d[1]).parent(),d=e(l,3).split("."),t("#norma_per_minute").find(".norma-amount-actual").text(d[0]).parent().find(".norma-amount-fraction").text("."+d[1]).parent(),t("#remains_days").text(e(s,0)),t("#remains_hours").text(e(u,0)),t("#remains_minutes").text(e(60*u,0));var f=100*Math.min(a,n),h=parseInt(f/n)||0,b=T-o,g=parseInt(100*b/T)||0,x=void 0;x=100===h?"progress-bar-success":h>=g?"progress-bar-success":h>.7*g?"progress-bar-info":h>.4*g?"progress-bar-warning":"progress-bar-danger",t("#objective_progress > .progress-bar").width(h+"%").removeClass("progress-bar-success progress-bar-info progress-bar-danger progress-bar-warning").addClass(x).children("span").text(h+"%達成"),t("#period_progress > .progress-bar").width(g+"%").children("span").text(g+"%経過");var _=a*T/b;t("#prediction_collection").text(e(Math.floor(_)));var k=Math.min(_/n,1),y=t("#objective_progress").width(),M=y*k-47;t(".pointer").css("left",M+"px");var w=y-M<230?-250:0;t(".pointer-label").css("margin-left",w+"px");var C="";if(a<n&&_>=n){var I=void 0,j=void 0;v.forEach(function(t){I=I||t[0],j=j||t[1]});var E=n/_*T,D=v.reduce(function(t,a){if(t)return t;var n=a[1]-a[0];return n<E?(E-=n,null):new Date(a[0]+E)},null),q=D.getMonth(),z=D.getDate(),N=D.getHours(),R=D.getMinutes(),S=q+1+"/"+z+" "+(N<10?"0"+N:N)+":"+(R<10?"0"+R:R);C=S+"頃に目標達成できそうよ。"}t("#prediction_completion_date").text(C)}function d(){var t="Webkit Moz O ms Khtml".split(" "),a=document.createElement("div");if(void 0!==a.style.animationName)return!0;for(var n=0;n<t.length;n++)if(void 0!==a.style[t[n]+"AnimationName"])return!0;return!1}function f(){var l=(new Date).getTime(),f=t("#period_dates");if(v.forEach(function(a){var n=a[1]-a[0],e=100*n/T+"%",i=new Date(a[0]),o=new Date(a[1]-1),r=i.getMonth()+1+"/"+i.getDate()+"-"+(o.getMonth()+1)+"/"+o.getDate(),s=l>=a[0]&&l<a[1],c=l>=a[1],u=s?"progress-bar-active":c?"progress-bar-expired":"progress-bar-remain";t('<div class="progress-bar">').width(e).text(r).addClass(u).appendTo(f)}),t('[data-objective-mode="'+_+'"]').show(),t('[data-objective-mode][data-objective-mode!="'+_+'"]').remove(),t("[name=current]:input").click(function(){this.select()}).TouchSpin({min:0,max:k,step:1}),"achievement"===_){var j=t("[name=objective]:input");t.each(h,function(a,n){t("<option />").attr("value",a).text(n+" ("+a+"個)").appendTo(j)})}else{t("select[name=objective]").click(function(){this.select()});var E=t("#increse_objective_list");b.forEach(function(a){t('<button class="btn btn-default" name="add"  type="button" />').val(a.value).attr("title",a.name).append(t('<i class="fa fa-arrow-up" />')).append(t("<span />").addClass("icon icon-"+a.unit)).appendTo(E)})}t("button[name=add]").click(function(a){a.preventDefault();var n=parseInt(t(this).val()),e=parseInt(t("[name=objective]:input").val());t("[name=objective]:input").val(e+n).trigger("change")}),t("button[name=reset]").click(function(a){a.preventDefault(),t("[name=objective]:input").val(0).trigger("change")}),t("[name=expectation]:input").change(function(){u(),p()}).val(w);var D=t("#prize_list");b.forEach(function(a){t('<div class="prize-list" />').append(t('<h4 class="prize-list-header" />').text(a.name).append(t('<span class="prize-value" />').text("@"+a.value))).append(t('<div class="prize-list-body" />').attr("data-prize",a.unit)).appendTo(D)});var q=g.reduce(function(t,a){return Math.max(t,a.drops.length)},0),z=o();z.maps.forEach(function(t,a){g[a].expectation=t.expectation}),I=z.syncCurrentEnabled;var N=void 0,R=function(){N&&clearTimeout(N),setTimeout(function(){var a=t("#map");g.forEach(function(t,n){var i=a.find("tr[data-map="+n+"]"),o=Math.max(parseInt(i.find("input[name=num_laps]").val())||0,0),r=Math.max(parseInt(i.find("input[name=num_drops]").val())||0,0),s=i.find("input[name=actual_expectation]"),c=Math.max(parseFloat(s.val())||0,0);"aggregate"===C&&(c=r/o||0,s.val(c));var u=Math.floor(c);i.find("button[name=increase]").val(u).text("+"+e(u)),z.maps[n].numLaps=o,z.maps[n].numDrops=r,t.expectation=z.maps[n].expectation=c}),r(z),m(),u(),p()},100)},S=t("#map").on("keyup","input[type=number]",function(){R(),i()}).on("change","input[type=number]",function(){R(),i()}).on("click","input[type=number]",function(){this.select()}).on("click","button[name=increase]",function(a){a.preventDefault();var n=t(this).closest("tr"),e=n.find("input[name=num_laps]"),i=parseInt(e.val())+1;e.val(i);var o=n.find("input[name=num_drops]"),r=parseInt(o.val())+parseInt(this.value);o.val(r),o.trigger("change")}).on("change","input[name=expectation_input_mode]",function(){C=t(this).val(),z.expectationInputMode=C,r(z),S.find("input[name=num_laps], input[name=num_drops]").parent().toggle("aggregate"===C).end().end().find("input[name=actual_expectation]").parent().toggle("direct"===C).end().end().find("input[name=sync]").closest("tfoot").toggle("aggregate"===C),R()}).on("click","input[name=sync]",function(){z.syncCurrentEnabled=I=this.checked,r(z),i()}),A=S.find("tbody");if(g.forEach(function(a,n){var e=z.maps[n],i=t("<td />").attr("data-chart",n).append(t('<span class="barchart" />')).append(t('<span class="barchart-label" />')).append(t('<span class="marathon" />'));t("<tr />").attr("data-map",n).append(t("<th />").text(a.name)).append(t("<td />").text(""+a.charisma+"/"+a.stamina)).append(function(){for(var n=a.drops.map(function(a){var n=a.icon?t("<i />").attr("title",a.name).addClass("icon icon-"+a.icon):t("<span />").text(a.name),e=a.set?t('<span class="badge" />').text("x"+a.set):null;return t("<td />").append(n).append(e)}),e=a.drops.length;e<q;e++)n.push(t("<td />"));return n}).append(function(){var a=t('<span class="input-group input-group-sm" />').append(t('<span class="input-group-addon">1周の期待値</span>')).append(t('<input type="number" name="actual_expectation" min="0" class="form-control" />').val(e.expectation)),n=t('<span class="input-group input-group-sm" />').append(t('<span class="input-group-addon">周回</span>')).append(t('<input type="number" name="num_laps" min="0" class="form-control" />').val(e.numLaps)).append(t('<span class="input-group-addon">ドロップ</span>')).append(t('<input type="number" name="num_drops" min="0" class="form-control" />').val(e.numDrops)).append(t('<span class="input-group-btn"><button name="increase" class="btn btn-default"></button></span>'));return t('<td class="expectation" />').append(n).append(a)}).append(i).prependTo(A)}),t("#map thead th.drops").attr("colspan",q),y){var H=t("#rewards tbody");x.forEach(function(a){var n=t('<span class="icon" />').addClass("icon-"+a.unit);t("<tr />").attr("data-amount",a.amount).append(t('<td class="text-right" />').html('<span class="diff"></span> '+a.amount)).append(t("<td />").html(n)).appendTo(H)})}var L=t("[name=estimate_map]:input").change(function(){m(),z.estimateMap=parseInt(t(this).val()),r(z)});g.forEach(function(a,n){t("<option />").val(n).text(a.name+" ("+a.charisma+"/"+a.stamina+")").prependTo(L)});for(var O=t("[name=estimate_rank]:input").change(function(){m(),z.estimateRank=parseInt(t(this).val()),r(z)}),J=1;J<=200;J++){var U=a(J),F=n(J),K=""+J+" ("+U+"/"+F+")";t("<option />").val(J).text(K).appendTo(O)}var W=t("[name=estimate_use_crystal]").change(function(){m(),z.estimateUseCrystal=t(this).val(),r(z)}),B=t("[name=estimate_natural_recovery]:input").change(function(){m(),z.estimateNaturalRecovery=this.checked,r(z)});t("*[title]").tooltip(),t("[name=current]:input").val(z.current),"exchange"===_?t("[name=objective]:input").val(z.objective):t("[name=objective]:input").val([z.objective]),t("[name=current]:input, [name=objective]:input").change(function(){z[this.name]=t(this).val(),r(z),s(),c(),p(),m()}),L.val(z.estimateMap),O.val(z.estimateRank),W.val(z.estimateUseCrystal),B.prop("checked",z.estimateNaturalRecovery),"exchange"===_&&c(),y&&s(),S.find("input[name=sync]").prop("checked",I).end().find('input[name=expectation_input_mode][value="'+z.expectationInputMode+'"]').prop("checked",!0).trigger("change").parent().addClass("active"),t("#initialize-button").on("click",function(){t.removeCookie(M),window.location.reload()});var G=d(),P=["webkitAnimationEnd","mozAnimationEnd","MSAnimationEnd","oanimationend","animationend"].join(" ");t("#estimate_tutorial").on("click","a",function(a){t("#map .expectation").each(function(){var n=t(this);G&&(a.preventDefault(),n.addClass("animated flash").one(P,function(){n.removeClass("animated flash")}))})}).on("click","button",function(a){z.estimateTutorialHidden=!0,r(z),t(a.delegateTarget).each(function(){var a=t(this);G?a.addClass("animated zoomOutRight").one(P,function(){a.hide()}):a.hide()})}).toggle(!z.estimateTutorialHidden).each(function(){var a=t(this),n=a.find(".anna");a.on("mouseenter",function(){n.addClass("animated bounce")}).on("mouseleave",function(){n.removeClass("animated bounce")})}),t("#estimate_bug").on("click","button",function(a){z.version++,r(z),t(a.delegateTarget).each(function(){var a=t(this);G?a.addClass("animated hinge").one(P,function(){a.hide()}):a.hide()})}).toggle(1===z.version).each(function(){var a=t(this),n=a.find(".anna");a.on("mouseenter",function(){n.addClass("animated bounce")}).on("mouseleave",function(){n.removeClass("animated bounce")})})}var v=[["2015/08/27 16:00:00","2015/09/03 10:00:00"],["2015/09/03 15:00:00","2015/09/10 10:00:00"]],h={25:"ピピンが仲間になる",50:"スキルレベル2",100:"初期レベル10",150:"スキルレベル3",200:"出撃コスト-1",250:"スキルレベル4",300:"出撃コスト-2",400:"スキルレベル5",500:"初期レベル20",600:"スキルレベル6",700:"出撃コスト-3",800:"スキルレベル7",900:"初期レベル30",1000:"スキルレベル8",1100:"出撃コスト-4",1200:"初期レベル40",1300:"スキルレベル9",1400:"出撃コスト-5",1500:"スキルレベル10",1600:"初期レベル50",1620:"+ 黒聖霊",1665:"+ ゴールドアーマー",1710:"+ 黒聖霊",1755:"+ プラチナアーマー",1800:"+ 虹聖霊"},b=[],g=[{name:"紅の霧の脅威",charisma:20,stamina:1,expectation:2,drops:[{name:"魔神の骨片1",icon:"demon-bone-1",set:2},{name:"花束",icon:"flower"}]},{name:"密林の防衛戦",charisma:30,stamina:2,expectation:3,drops:[{name:"魔神の骨片1",icon:"demon-bone-1",set:3},{name:"フューネス",icon:"funes"},{name:"魔水晶",icon:"demon-crystal-1"}]},{name:"猛追の奪還戦",charisma:40,stamina:4,expectation:6,drops:[{name:"魔神の骨片3",icon:"demon-bone-3",set:1},{name:"魔神の骨片5",icon:"demon-bone-1",set:3},{name:"ソーマ",icon:"soma"},{name:"バラッド",icon:"barrad"}]},{name:"魔神の骨の力",charisma:50,stamina:7,expectation:16,drops:[{name:"魔神の骨片5",icon:"demon-bone-5",set:2},{name:"魔神の骨片3",icon:"demon-bone-3",set:2},{name:"ジョバンニ",icon:"giovanni"},{name:"白銀の聖霊",icon:"platinum-sprit"}]},{name:"忍者と盗賊",charisma:80,stamina:9,expectation:15,drops:[{name:"魔神の骨片5",icon:"demon-bone-5",set:3},{name:"リカルド",icon:"ricard"},{name:"白バケツ",icon:"platinum-bucket"},{name:"魔水晶",icon:"demon-crystal-2"}]},{name:"紅の包囲網",charisma:40,stamina:5,expectation:6,drops:[{name:"魔神の骨片3",icon:"demon-bone-3",set:1},{name:"魔神の骨片1",icon:"demon-bone-1",set:3},{name:"カゲロウ",icon:"kagerou"},{name:"白バケツ",icon:"platinum-bucket"}]},{name:"邪悪な共謀",charisma:70,stamina:8,expectation:13,drops:[{name:"魔神の骨片5",icon:"demon-bone-5",set:2},{name:"魔神の骨片3",icon:"demon-bone-3",set:1},{name:"ルビー",icon:"ruby"},{name:"ミーシャ",icon:"misha"}]},{name:"魔に身を捧げし者",charisma:90,stamina:12,expectation:26,drops:[{name:"魔神の骨片5",icon:"demon-bone-5",set:4},{name:"魔神の骨片3",icon:"demon-bone-3",set:2},{name:"虹の聖霊",icon:"rainbow-sprit"}]},{name:"ピピンの決心",charisma:100,stamina:2,expectation:0,drops:[{name:"金の聖霊",icon:"gold-sprit"},{name:"白の聖霊",icon:"platinum-sprit"},{name:"黒の聖霊",icon:"black-sprit"},{name:"虹の聖霊",icon:"rainbow-sprit"}]}],x=[{amount:45,unit:"gold-bucket"},{amount:90,unit:"gold-sprit"},{amount:135,unit:"platinum-bucket"},{amount:180,unit:"gold-sprit"},{amount:225,unit:"crystal-fragment"},{amount:270,unit:"platinum-sprit"},{amount:315,unit:"gold-bucket"},{amount:360,unit:"platinum-sprit"},{amount:405,unit:"platinum-bucket"},{amount:450,unit:"black-sprit"},{amount:495,unit:"crystal-fragment"},{amount:540,unit:"black-sprit"},{amount:585,unit:"gold-bucket"},{amount:630,unit:"rainbow-sprit"},{amount:675,unit:"platinum-bucket"},{amount:720,unit:"platinum-sprit"},{amount:765,unit:"crystal-fragment"},{amount:810,unit:"platinum-sprit"},{amount:855,unit:"gold-bucket"},{amount:900,unit:"black-sprit"},{amount:945,unit:"platinum-bucket"},{amount:990,unit:"platinum-sprit"},{amount:1035,unit:"crystal-fragment"},{amount:1080,unit:"platinum-sprit"},{amount:1125,unit:"gold-bucket"},{amount:1170,unit:"black-sprit"},{amount:1215,unit:"platinum-bucket"},{amount:1260,unit:"black-sprit"},{amount:1305,unit:"crystal-fragment"},{amount:1350,unit:"rainbow-sprit"},{amount:1395,unit:"gold-bucket"},{amount:1440,unit:"platinum-sprit"},{amount:1485,unit:"platinum-bucket"},{amount:1530,unit:"platinum-sprit"},{amount:1575,unit:"crystal-fragment"},{amount:1620,unit:"black-sprit"},{amount:1665,unit:"gold-bucket"},{amount:1710,unit:"black-sprit"},{amount:1755,unit:"platinum-bucket"},{amount:1800,unit:"rainbow-sprit"}],_="achievement",k=1/0,y=!0,M="demon-bone-timer",w="stamina",C="direct",I=!0,j={current:20,objective:1500,estimateMap:7,estimateRank:100,estimateUseCrystal:"both",estimateNaturalRecovery:!0,expectationInputMode:C,syncCurrentEnabled:I,maps:g.map(function(t){return{numLaps:1,numDrops:Math.floor(t.expectation),expectation:t.expectation}}),estimateTutorialHidden:!1,version:2};v=v.map(function(t){return t.map(Date.parse)});var T=v.reduce(function(t,a){return t+a[1]-a[0]},0);t(function(){f(),setInterval(l,1e3)})}).call(a,n(2))}},[710]);