define([
'lib/types/formats/date-time',
'lib/types/formats/ipv4',
'lib/types/formats/ipv6',
'lib/types/formats/email',
'lib/types/formats/hostname',
'lib/types/formats/uri'
], function(dateTime, ipv4, ipv6, email, hostname, uri){
	return {
		'date-time' : dateTime,
		'ipv4' : ipv4,
		'ipv6' : ipv6,
		'email' : email,
		'hostname' : hostname,
		'uri' : uri
	}
});