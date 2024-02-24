const permissions =  require('./permissionData.json');

function isResourceAllowed( id,host=null, userId=null, userAgent=null,method='ALL'){
	method=method?method.toUpperCase():'ALL';
	id=id.toLowerCase();
	let filteredPermissions=getPermission(  host, userId, userAgent).filter(x=> 
		x.allowedResource.indexOf(id)>=0 
		&& (x.hosts && x.hosts.length>0 ? x.hosts.indexOf(host+'')>=0 : true ) 
		&& (x.methods && x.methods.length>0  && method!='OPERATION'? x.methods.indexOf(host+'')>=0 : true )
	);
	return filteredPermissions.length>0;
}

function getPermission( host=null, userId=null, userAgent=null){
	userId=(userId??'').match(/^\w+$/g)?userId:'*';
	userAgent=userAgent?userAgent:'*';
	let filteredPermissions=permissions.filter(x=>
		(x.hosts && x.hosts.length>0 ? x.hosts.indexOf(host+'')>=0 : true )
		&& (x.userAgents && x.userAgents.length>0 ? x.userAgents.filter(y=>(new RegExp(y)).test(userAgent)).length>=0 : true )
		&& (x.allowOnlyForUserId && x.allowOnlyForUserId.length>0 ? x.allowOnlyForUserId.indexOf(userId+'')>=0 : true  )
		&& (!(x.allowOnlyForUserId && x.allowOnlyForUserId.length>0 ? x.allowOnlyForUserId.indexOf('!'+userId)>=0 : false  ))
	);
	return filteredPermissions;
}

module.exports = {permissions:permissions, isResourceAllowed:isResourceAllowed, getPermission:getPermission};