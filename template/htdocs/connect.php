<?php

include_once "sql.php";

if (defined('GSSERVICE')) {
	$db=sql_get_db('p:127.0.0.1','gyrostart','root','mnstudio','db');
} else {
	$db=sql_get_db('127.0.0.1','gyrostart','root','mnstudio','db');
}
