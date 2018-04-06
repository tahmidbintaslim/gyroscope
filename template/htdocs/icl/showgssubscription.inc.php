<?php

function showgssubscription(){
	global $db;
	
	$now=time();
	$user=userinfo();
	$gsexpiry=$user['gsexpiry']+0;
	$gstier=$user['gstier']+0;
	$dexpiry='<em>never</em>';

	if ($gsexpiry>0) $dexpiry=date('Y-n-j g:ia',$gsexpiry);
?>
<div class="section">
	<div class="sectiontitle">Subscription</div>
	
	<?
	if ($gsexpiry!=0&&$gsexpiry<$now){
	?>
	<div class="warnbox">
	Your subscription has expired. Functionality of this application is reduced until a payment is arranged.
	</div>
	<?	
	}
	?>
	
	<div class="inputrow">
		<div class="formlabel">
			Expiry: <?echo $dexpiry;?>
		</div>
	</div>
	
</div>
<?		
}