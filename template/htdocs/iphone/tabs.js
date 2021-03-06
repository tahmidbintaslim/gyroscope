document.tabcount=0;
document.tabviews=[];
document.tabkeys=[];
document.tabtitles=[];
document.tabseq=[];

document.currenttab=-1;
gettabid=function(key){
	var i;
	for (i=0;i<document.tabcount;i++) if (document.tabkeys[i]==key) return i;
	
	return -1;	
}

navback=function(){
	if (document.tabseq.length<=1) return;
	document.tabseq.pop();

	var obj=document.tabseq.pop();
	if (obj==null||obj==0) {
		document.viewmode=1;
		showdeck();
		return;
	}
	showtab(obj);
	
}

function closetabtree(root,sub){
	if (!document.tabkeys) return;
	
	if (!sub) document.toclose=[];

	for (var i=0; i<document.tabkeys.length; i++){
		var tab=document.tabtitles[i];
		var tabkey=document.tabkeys[i];
		if (tab&&tab.parenttab&&tab.parenttab==root) closetabtree(tabkey,1);
	}
	
	document.toclose.push(root);
	
	if (!sub) {

		var cf=function(tk){return function(){
			closetab(tk);	
		}}
					
		for (var i=0; i<document.toclose.length; i++){
			var tabkey=document.toclose[i];
			setTimeout(cf(tabkey),i*50);	
		}
	}
	
	if (self.livechat_updatesummary&&document.chatstatus=='online') livechat_updatesummary();

}

showtab=function(key,opts){
  var i;
  rotate();
  var tabid=gettabid(key);
  if (tabid==-1) return;
  if (self.onrotate) onrotate();
  document.currenttab=tabid;

  document.tabseq.push(key);
  document.viewmode=2;
  
  for (i=0;i<document.tabcount;i++){
	  if (i==tabid) continue;
	  document.tabviews[i].style.display='none';
	  document.tabtitles[i].className='dulltab';
  }	
  document.tabviews[tabid].style.display='block';
  document.tabtitles[tabid].className='activetab';

//wrapping
  var t=document.tabtitles[document.tabcount-1];
  var topmargin=0;
  
      document.rowcount=(t.offsetTop-topmargin)/28+1;
      if (!document.lastrowcount) document.lastrowcount=1;
      if (document.lastrowcount!=document.rowcount) {
        //gid('tabtitles').style.height=30*document.rowcount+'px';
        //gid('tabviews').style.top=80+30*(document.rowcount-1)+'px';
        //gid('tabviews').setAttribute("scale:ch",105+30*(document.rowcount-1));
        gid('tabviews').scalech=105+28*(document.rowcount-1);
        
        scaleall(document.body);
      }
      document.lastrowcount=document.rowcount;
      if (opts&&opts.bookmark) gototabbookmark(opts.bookmark);
      var keyparts=key.split('_');
      var ckey=keyparts[0];
      if (self['tabviewfunc_'+ckey]) self['tabviewfunc_'+ckey](keyparts[1]);
      if (self.livechat_updatesummary&&document.chatstatus=='online') livechat_updatesummary();      
}

tablock=false;

function settabtitle(key,title,opts){
	var tabid=gettabid(key);
	if (tabid==-1) return;
	
	var tabhtml="<nobr><a class=\"tt\" onclick=\"showtab('"+key+"');\">"+title+"</a><a onclick=\"closetab('"+key+"')\"><span class=\"tabclose\"></span></a></nobr>";
    if (opts!=null&&opts.noclose) tabhtml="<nobr><a class=\"tt\" onclick=\"showtab('"+key+"');\">"+title+"</a><span class=\"noclose\"></span></nobr>";
	if (title) document.tabtitles[tabid].innerHTML=tabhtml;		

}

function reloadtab(key,title,params,loadfunc,data,opts){

	//if tab doesn't exist, ignore it
	var tabid=gettabid(key);
	if (tabid==-1) return;
	
	if (document.tabtitles[tabid].tablock) return;
	document.tabtitles[tabid].tablock=1;
	
	var rq=xmlHTTPRequestObject();
	
	var scn=document.appsettings.codepage+'?cmd=';
	
  	if (document.wssid) params=params+'&wssid_='+document.wssid;
  	
	rq.open('POST',scn+params+'&hb='+hb(),true);
	rq.setRequestHeader('Content-Type','application/x-www-form-urlencoded; charset=UTF-8');
	
	var ct=document.tabviews[tabid];
	ct.slowtimer=setTimeout(function(){
		var first=ct.firstChild;
		if (ct.gswi) return;
		var wi=document.createElement('img'); wi.src='imgs/hourglass.gif'; ct.gswi=wi;
		if (gid('statusc')!=ct) wi.style.margin='10px';
		if (first==null) ct.appendChild(wi); else ct.insertBefore(wi,first);
		ct.style.opacity=0.5; ct.style.filter='alpha(50)'; ct.style.color='#999999';
	},800);
  

  

  rq.onreadystatechange=function(){
    if (rq.readyState==4){
	  if (ct.slowtimer) clearTimeout(ct.slowtimer);
	  
	  var xtatus=rq.getResponseHeader('X-STATUS');
	  if (rq.status==403||(xtatus|0)==403){
		    if (self.skipconfirm) skipconfirm(); 
		  	window.location.href='login.php';
		    return;
      }	

	  if (rq.status==401||(xtatus|0)==401){
		  ajxjs(self.showgssubscription,'gssubscriptions.js');
		  showgssubscription();
	      return;
	  }            
  
	    
      document.tabtitles[tabid].tablock=null;
      
	cancelgswi(ct);
	var apperror=rq.getResponseHeader('apperror');
	if (apperror!=null&&apperror!=''){
		salert('Error: '+decodeURIComponent(apperror));
		return;	
	}       

	var newkey=rq.getResponseHeader('newkey');

	if (newkey!=null&&newkey!='') {
		var newparams=rq.getResponseHeader('newparams');
		if (newparams==null||newparams==''){
			salert('Incomplete key change');
			return;	
		}
		
		var newloadfunc=rq.getResponseHeader('newloadfunc');
		if (newloadfunc!=null&&newloadfunc!='') loadfunc=function(){eval(newloadfunc)};
		
		document.tabtitles[tabid].reloadinfo={params:newparams,loadfunc:loadfunc,data:null,opts:null};

		document.tabkeys[tabid]=newkey;
		
		if (document.tabseq){
			for (i=0;i<document.tabcount;i++) if (document.tabkeys[i]==key) {console.warn('key collision; new key ignored');newkey=key;}
			
			for (var i=0;i<document.tabseq.length;i++){
				if (document.tabseq[i]==key) document.tabseq[i]=newkey;
			}
		}
		key=newkey;
		
	}   

	var parenttab=rq.getResponseHeader('parenttab');
	if (parenttab!=null&&parenttab!='') {		
		document.tabviews[tabid].parenttab=parenttab;
	}
		
	var newtitle=rq.getResponseHeader('newtitle');
	if (newtitle!=null&&newtitle!=''){
		title=decodeURIComponent(newtitle);	
	}	       
		
	if (opts&&opts.persist) document.tabtitles[tabid].reloadinfo={params:params,loadfunc:loadfunc,data:data,opts:opts};

	var tabhtml="<nobr><a class=\"tt\" onclick=\"showtab('"+key+"');\">"+title+"</a><a onclick=\"closetab('"+key+"')\"><span class=\"tabclose\"></span></a></nobr>";
	if (opts!=null&&opts.noclose) tabhtml="<nobr><a class=\"tt\" onclick=\"showtab('"+key+"');\">"+title+"</a><span class=\"noclose\"></span></nobr>";
  
    if (title) document.tabtitles[tabid].innerHTML=tabhtml;
	
  	  var reloader="<div class=\"reloader\" id=\"tabreloader_"+key+"\"><a onclick=\"refreshtab('"+key+"');\">"+document.dict['tab_reload']+"</a></div>";
	document.tabviews[tabid].innerHTML=reloader+rq.responseText;
	if (loadfunc!=null) loadfunc(rq);
	if (opts&&opts.bookmark) gototabbookmark(opts.bookmark);
	scaleall(document.body);
	}
  }
  rq.send(data);
}

function addtab(key,title,params,loadfunc,data,opts){
  document.viewmode=2;
  rotate();
  var i;
  if (document.tablock!=null) return;
  document.tablock=true;
  
  for (i=0;i<document.tabcount;i++) {
	if (document.tabkeys[i]==key) {
        showtab(key,opts);
        document.tablock=null;
		return;
	}
  }
  
  var c=document.createElement('div');
  c.style.display='none';
  
  var t=document.createElement('span');
  var tabhtml="<nobr><a class=\"tt\" onclick=\"showtab('"+key+"');\">"+title+"</a><a onclick=\"closetab('"+key+"')\"><span class=\"tabclose\"></span></a></nobr>";
  if (opts!=null&&opts.noclose) tabhtml="<nobr><a class=\"tt\" onclick=\"showtab('"+key+"');\">"+title+"</a><span class=\"noclose\"></span></nobr>";
  if (title) t.innerHTML=tabhtml;
  gid('tabtitles').appendChild(t);
  gid('tabviews').appendChild(c);
  c.slowtimer=setTimeout(function(){c.innerHTML='<image class="hourglass" src="imgs/hourglass.gif">';},800);

  t.reloadinfo={params:params,loadfunc:loadfunc,data:data,opts:opts};

  document.tabviews[document.tabcount]=c;
  document.tabtitles[document.tabcount]=t;
  document.tabkeys[document.tabcount]=key;
  document.tabcount++;
  showtab(key,opts);
  

  var rq=xmlHTTPRequestObject();
  var scn=document.appsettings.codepage+'?cmd=';
  
  if (document.wssid) params=params+'&wssid_='+document.wssid;  
  
  rq.open('POST',scn+params+'&hb='+hb(),true);
  
  rq.setRequestHeader('Content-Type','application/x-www-form-urlencoded; charset=UTF-8');
  rq.onreadystatechange=function(){
    if (rq.readyState==4){
	  if (c.slowtimer) clearTimeout(c.slowtimer);
	  
	  var xtatus=rq.getResponseHeader('X-STATUS');
	  if (rq.status==403||(xtatus|0)==403){
		    if (self.skipconfirm) skipconfirm(); 
		  	window.location.href='login.php';
		    return;
      }

	var apperror=rq.getResponseHeader('apperror');
	if (apperror!=null&&apperror!=''){
		salert('Error: '+decodeURIComponent(apperror));
		document.tablock=null;
		return;	
	}  
	
	      
		var parenttab=rq.getResponseHeader('parenttab');
		if (parenttab!=null&&parenttab!='') {		
			t.parenttab=parenttab;
		}
      	  
	  var reloader="<div class=\"reloader\" id=\"tabreloader_"+key+"\"><a onclick=\"refreshtab('"+key+"');\">"+document.dict['tab_reload']+"</a></div>";
      c.innerHTML=reloader+rq.responseText;

      document.tablock=null;
      if (loadfunc!=null) loadfunc(rq);
      if (opts&&opts.bookmark) gototabbookmark(opts.bookmark);
    }
  }
  rq.send(data);
}

closetab=function(key){
  var tabid=gettabid(key);
  if (tabid==-1) return;
    
  gid('tabtitles').removeChild(document.tabtitles[tabid]);
  gid('tabviews').removeChild(document.tabviews[tabid]);

  var i;
  for (i=tabid;i<document.tabcount-1;i++){
	  document.tabtitles[i]=document.tabtitles[i+1];
	  document.tabviews[i]=document.tabviews[i+1];
	  document.tabkeys[i]=document.tabkeys[i+1];	  
  }
  document.tabcount--;

	if (document.tabseq){
		for (var i=0;i<document.tabseq.length;i++) if (document.tabseq[i]==key) document.tabseq[i]=null;
	}
		
	if (document.currenttab==tabid) {
		document.currenttab=0;
		var lasttab=null;
		while (lasttab==null&&document.tabseq.length>0){
			lasttab=document.tabseq.pop();	
		}  
		  
		if (lasttab!=null) {
			showtab(lasttab);
			return;	
		}
	}
  
  if (document.tabcount==0) {document.currenttab=-1; return;}
  showtab(document.tabkeys[document.currenttab]);
  if (self.livechat_updatesummary&&document.chatstatus=='online') livechat_updatesummary();

}

function refreshtab(key,skipconfirm){
	
  var tabid=gettabid(key);
  if (tabid==-1) return;
  
  if (!skipconfirm&&!sconfirm(document.dict['confirm_refresh_tab'])) return;
 
  var tab=document.tabtitles[tabid];
  if (!tab.reloadinfo) return;
  tab.style.color='#000000';
  reloadtab(key,null,tab.reloadinfo.params,tab.reloadinfo.loadfunc,tab.reloadinfo.data,tab.reloadinfo.opts);
}

function closetabs(rectype){
	if (!document.tabkeys) return;
	
	var cf=function(tk){return function(){
		closetab(tk);	
	}}
	
	for (var i=0; i<document.tabkeys.length; i++){
		var tabkey=document.tabkeys[i];
		var id=tabkey.replace(rectype+'_','');
		if (parseInt(id,10)==id) setTimeout(cf(tabkey),i*50);	
	}
	
}

function sconfirm(msg){
	var a=hb();
	var res=confirm(msg);
	var b=hb();
	if (b-a<120) window.location.reload();
	return res;
}

function salert(msg){
	var a=hb();
	alert(msg);
	var b=hb();
	if (b-a<120) window.location.reload();
}

function sprompt(title,def){
	var a=hb();
	var res=prompt(title,def);
	var b=hb();
	if (b-a<120) window.location.reload();
	return res;
}

function gototabbookmark(id){
	if (!document.iphone_portrait){
		if (!gid(id)||!gid('tabviews')) return;
		gid('tabviews').scrollTop=gid(id).offsetTop-90;
	} else {
		if (!gid(id)) return;
		document.body.scrollTop=gid(id).offsetTop-130;
	}
}

function marktabchanged(tabkey,hide){
	var mode='block';
	if (hide) mode='none';
	if (gid('changebar_'+tabkey)) gid('changebar_'+tabkey).style.display=mode;
}
