(function(){
  // Menu e busca
  var menu=document.getElementById('menu'), busca=document.getElementById('busca');
  function alterna(el,abrir){
    if(!el) return;
    el.classList.toggle('aberto',abrir);
    el.setAttribute('aria-hidden',String(!abrir));
    document.body.style.overflow=abrir?'hidden':'';
  }
  var bm=document.getElementById('abrirMenu'), bb=document.getElementById('abrirBusca');
  if(bm) bm.addEventListener('click',function(){alterna(menu,true)});
  if(bb) bb.addEventListener('click',function(){alterna(busca,true);setTimeout(function(){var q=document.getElementById('q'); if(q) q.focus();},60)});
  if(menu) menu.querySelectorAll('[data-fechar]').forEach(function(b){b.addEventListener('click',function(){alterna(menu,false)})});
  if(busca) busca.querySelectorAll('[data-fechar]').forEach(function(b){b.addEventListener('click',function(){alterna(busca,false)})});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'){alterna(menu,false);alterna(busca,false)}});

  // Capa: foto parada enquanto a página sobe, escurecendo aos poucos
  var capa=document.querySelector('.capa');
  if(capa){
    var foto=capa.querySelector('img'), esc=capa.querySelector('.escuro');
    var reduz=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var pendente=false;
    function rolar(){
      pendente=false;
      var y=window.scrollY||window.pageYOffset, h=capa.offsetHeight;
      if(y>h+40) return;
      if(!reduz) foto.style.transform='translate3d(0,'+Math.round(y*0.92)+'px,0)';
      esc.style.opacity=Math.min(0.62,(y/h)*0.9).toFixed(3);
    }
    window.addEventListener('scroll',function(){if(!pendente){pendente=true;requestAnimationFrame(rolar)}},{passive:true});
    rolar();

    // Tenta a foto oficial da inauguração; se não carregar, fica a provisória
    var oficial=foto.getAttribute('data-oficial');
    if(oficial){
      var t=new Image();
      t.onload=function(){foto.src=t.src;var c=capa.querySelector('.credito');if(c)c.hidden=false;};
      t.src=oficial;
    }
  }
})();

// Tela de carregamento: uma vez por visita
(function(){
  var c=document.getElementById('carga'); if(!c) return;
  var visto=false; try{visto=sessionStorage.getItem('bi-carga')==='1'}catch(e){}
  if(visto){c.remove();return;}
  try{sessionStorage.setItem('bi-carga','1')}catch(e){}
  document.documentElement.style.overflow='hidden';
  requestAnimationFrame(function(){c.classList.add('play')});
  setTimeout(function(){c.classList.add('sai');document.documentElement.style.overflow='';setTimeout(function(){c.remove()},600)},3700);
})();

// Ícones da inicial: traço se desenha ao aparecer na tela
(function(){
  var a=document.querySelectorAll('.atalho'); if(!a.length||!('IntersectionObserver' in window)) return;
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){
    var el=e.target; var i=[].indexOf.call(a,el)%4;
    el.querySelectorAll('.ic *').forEach(function(p){p.style.animationDelay=(i*0.08)+'s'});
    el.classList.add('visto'); io.unobserve(el);}})},{threshold:.4});
  a.forEach(function(el){io.observe(el)});
})();
