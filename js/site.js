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
    // Tenta a foto oficial da inauguração; se não carregar, fica a provisória
    var oficial=foto.getAttribute('data-oficial');
    if(oficial){
      var t=new Image();
      t.onload=function(){foto.src=t.src;var c=capa.querySelector('.credito');if(c)c.hidden=false;};
      t.src=oficial;
    }
  }
})();

// Tela de carregamento: aparece ao abrir ou recarregar o site; some só quando a pessoa volta para o início vindo de outra página do site
(function(){
  var c=document.getElementById('carga'); if(!c) return;
  if(document.documentElement.classList.contains('sem-carga')){c.remove();return;}
  document.documentElement.style.overflow='hidden';
  requestAnimationFrame(function(){c.classList.add('play')});
  setTimeout(function(){c.classList.add('sai');document.documentElement.style.overflow='';setTimeout(function(){c.remove()},600)},3700);
})();

// Ícones da inicial: o traço se desenha toda vez que o cartão entra na tela
(function(){
  var a=document.querySelectorAll('.atalho'); if(!a.length||!('IntersectionObserver' in window)) return;
  var io=new IntersectionObserver(function(es){es.forEach(function(e){
    var el=e.target;
    if(e.isIntersecting && e.intersectionRatio>=0.4){
      if(el.classList.contains('visto')) return;
      var i=[].indexOf.call(a,el)%4;
      el.querySelectorAll('.ic *').forEach(function(p){p.style.animationDelay=(i*0.08)+'s'});
      el.classList.add('visto');
    } else if(!e.isIntersecting){
      el.classList.remove('visto');
    }
  })},{threshold:[0,0.4]});
  a.forEach(function(el){io.observe(el)});
})();

// Busca no site: procura nas páginas da biblioteca (o índice é gerado por ferramentas/gerar-indice.py)
(function(){
  var form=document.querySelector('.busca-site'); if(!form) return;
  var q=document.getElementById('q'), res=document.getElementById('resultados'), lm=document.getElementById('linkMinerva');
  var indice=null, carregando=false;
  function sem(t){return t.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase()}
  function esc(t){return t.replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function carrega(fn){
    if(indice) return fn();
    if(window.INDICE_BUSCA){prepara();return fn();}
    if(carregando) return; carregando=true;
    var s=document.createElement('script'); s.src='js/indice-busca.js?v=1';
    s.onload=function(){prepara();fn()}; document.head.appendChild(s);
  }
  function prepara(){
    indice=window.INDICE_BUSCA.map(function(e){return {e:e,t:sem(e.t),x:sem(e.x),p:sem(e.p)}});
  }
  // trecho do texto em volta da primeira palavra encontrada, com as palavras destacadas
  function trecho(txt,termos){
    var n=sem(txt), i=-1;
    termos.forEach(function(t){var k=n.indexOf(t); if(k>=0&&(i<0||k<i)) i=k});
    var ini=Math.max(0,i-60), fim=Math.min(txt.length,ini+170);
    var s=(ini>0?'…':'')+txt.slice(ini,fim)+(fim<txt.length?'…':'');
    return marca(s,termos);
  }
  function marca(s,termos){
    var n=sem(s), marcas=[];
    termos.forEach(function(t){var k=0;while((k=n.indexOf(t,k))>=0){marcas.push([k,k+t.length]);k+=t.length}});
    marcas.sort(function(a,b){return a[0]-b[0]});
    var out='',pos=0;
    marcas.forEach(function(m){if(m[0]<pos) return; out+=esc(s.slice(pos,m[0]))+'<mark>'+esc(s.slice(m[0],m[1]))+'</mark>'; pos=m[1]});
    return out+esc(s.slice(pos));
  }
  function busca(){
    var v=q.value.trim();
    if(lm) lm.href=v?'https://minerva.ufrj.br/F?func=find-b&request='+encodeURIComponent(v):'https://minerva.ufrj.br/F';
    if(v.length<2){res.innerHTML='';form.classList.remove('com-resultados');return;}
    carrega(function(){
      var termos=sem(v).split(/\s+/).filter(function(t){return t.length>1});
      if(!termos.length){res.innerHTML='';return;}
      var achados=[];
      indice.forEach(function(r){
        var pts=0, ok=termos.every(function(t){
          var a=r.t.indexOf(t)>=0, b=r.x.indexOf(t)>=0, c=r.p.indexOf(t)>=0;
          if(a) pts+=10+(r.t.indexOf(t)===0?4:0); if(b) pts+=2; if(c) pts+=1;
          return a||b||c;
        });
        if(ok) achados.push({r:r,pts:pts});
      });
      achados.sort(function(a,b){return b.pts-a.pts});
      form.classList.add('com-resultados');
      if(!achados.length){
        res.innerHTML='<p class="vazio">Nada encontrado no site para “'+esc(v)+'”. Se for um livro, pesquise no catálogo pelo link abaixo.</p>';
        return;
      }
      res.innerHTML='<ul>'+achados.slice(0,8).map(function(a){
        var e=a.r.e;
        return '<li><a href="'+e.u+'"><small>'+esc(e.p)+'</small><b>'+marca(e.t,termos)+'</b>'+(e.x?'<span>'+trecho(e.x,termos)+'</span>':'')+'</a></li>';
      }).join('')+'</ul>'+(achados.length>8?'<p class="mais">Mostrando 8 de '+achados.length+' resultados. Use mais palavras para refinar.</p>':'');
    });
  }
  var t; q.addEventListener('input',function(){clearTimeout(t);t=setTimeout(busca,120)});
  q.addEventListener('focus',function(){carrega(function(){})},{once:true});
  form.addEventListener('submit',function(ev){
    ev.preventDefault();
    var a=res.querySelector('a'); if(a) a.click();
  });
  // ao clicar num resultado da mesma página, fecha a busca
  res.addEventListener('click',function(ev){
    var a=ev.target.closest('a'); if(!a) return;
    var b=document.getElementById('busca'); if(b){b.classList.remove('aberto');b.setAttribute('aria-hidden','true');document.body.style.overflow='';}
  });
})();
