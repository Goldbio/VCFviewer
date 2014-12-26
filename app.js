var express = require('express');
var Mongolian = require("mongolian");
var __ = require('underscore');
var cluster = require('cluster');
var crypto = require('crypto');
var spawn = require("child_process").spawn;
var request = require('request');
var fs = require('fs');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var Busboy = require('busboy');
var routes = require('./routes/index');
var exec = require('child_process').exec;
var users = require('./routes/users');
var expressJwt = require('express-jwt');
var jwt = require('jsonwebtoken');
var inspect = require('util').inspect;
var moment = require('moment'); 
var nodemailer = require('nodemailer');
var sticky = require('sticky-session');
var http = require('http');


var app = express();
app.set('port', process.env.PORT || 7777); 
var server = require('http').Server(app);
var io= require('socket.io')(server);

sticky(server).listen( app.get('port'), function(){
	console.log('Express server on '+ app.get('port') );
});

io.on('connection', function(socket){
	socket.emit('connected', socket.id );
	socket.join(socket.id );
});




// DB  setting 
var Mongoserver = new Mongolian;
var db = Mongoserver.db("vcfviewer");
var db_user = db.collection("user");
var db_project = db.collection("project");
var db_chat = db.collection('chat');
var ObjectId = Mongolian.ObjectId;

// Email sender 

var mailSender = nodemailer.createTransport({
	service:' Gmail',
	auth: {
		user:'contact@geference.com' ,
		pass:'wpvjfjstm'
	}

});

/* view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
*/
/*
app.use(function (req, res, next) {
	res.header('Access-Control-Allow-Origin', "*");
	res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Content-type, Authorization, X-Requested-With');
	next();
});
*/
app.use('/', express.static(__dirname + '/'));
app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


var secret = '123456';
app.use('/api', expressJwt({ secret :secret }) );

/*
app.all('/*', function(req,res,next){
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "*");
	next();
});
*/

app.use('/', routes);
app.use('/users', users);

var lock_MDS_process=false;

app.post('/api/upload', function(req,res){
	// Upload VCF files into S3 

	var fileClass;
	var user_email = req.user.id;
	var projectId;
	var fileClass;
	var client_id;

	var busboy = new Busboy({ headers: req.headers });
	busboy.on( 'file',  function(fieldname, file, filename, encoding, mimetype){

		if(!fs.existsSync( 'VCFjsonS3/'+user_email ) ){
			fs.mkdirSync( 'VCFjsonS3/'+user_email , 0766);
		} 
		file.pipe(fs.createWriteStream('VCFjsonS3/'+user_email+'/'+filename));
		file.pipe(fs.createWriteStream('/data/temp_user_data/'+user_email+'/'+filename));
			
		
		file.on('end', function(){

			var uploadedFile={};
			uploadedFile['name'] = filename;
			uploadedFile['class'] = 'Case';
			uploadedFile['status'] = 'uploaded';


			db_project.update(
				{ _id : new ObjectId( projectId ) },
				{ $addToSet : { files  : uploadedFile  }}
			);
	
			console.log('# Upload file : '+ user_email, filename, client_id,  projectId );

			// Update MDS coordinates 
			var runMDSInterval =setInterval( function(){
				if( !lock_MDS_process ){
					lock_MDS_process=true;
					UpdateMDS2D( user_email, filename, projectId, client_id); 
					clearInterval( runMDSInterval );
				}
			}, 300);

			// Annotate uploaded file 
			Annovar_annotation(user_email, filename, projectId,client_id );


			// annovar_annotation(user_email, filename, projectId,client_id );
		});
	});

	busboy.on('field', function( fieldname, val ){
		var value = inspect(val).replace(/^\'|\'$/g,'') ;
		switch (fieldname) {
			case 'projectId':
				projectId = val;
				break;
			case 'class':
				fileClass = val;
				break;
			case 'client_id':
				client_id=val;
		}

	});

	busboy.on('finish', function(){	
		res.end('success');
	});

	return req.pipe(busboy);
});

var root_dir='/var/www/VCFviewer_server/';
var ANNOVAR_server = 'http://54.65.43.210:3000/';


function UpdateMDS2D( user_email, filename, projectId, client_id ){
	db_project.findOne({ _id: new ObjectId( projectId) }, function(err, project){
			var project_files=__.map( project.files, function(file){ return file['name'] });

			var mds_res='';
			console.log(  JSON.stringify(project_files), JSON.stringify(project.distance) );
			ps_mds = spawn('python', ['vcf_bin/calculate_distance_btw_VCF.py', user_email, filename, JSON.stringify(project_files) , JSON.stringify(project.distance) ] );
			ps_mds.stdout.on('data', function(data){
				mds_res+=data;
			});

			ps_mds.stderr.on('data', function(data){
				console.log('stderr :'+ data );
			});


			ps_mds.on('exit', function(){
				// Save MDS 2D coordinates 
				console.log( '@@@ MDS update done '+ filename);
				mds_res=JSON.parse( mds_res);


				db_project.update(
					{ _id : new ObjectId( projectId) ,
						'files.name': filename
					},
					{
						$set: { 'files.$.numVariants': mds_res['numVCFVariants']  }	
					}
				);

				if( ! mds_res['dist'] ){
				
					db_project.update(
							{ _id : new ObjectId( projectId),
								'files.name': filename
							},     
							{  $set : {'files.$.mds2d': [0,0] }}
					);

				}
				else{
					db_project.update(
						{ _id : new ObjectId( projectId) },
						{ $addToSet: { 'distance' : { $each : mds_res['dist'] } }	}	

					);

					for( i in mds_res['mds'] ){
						var vcf_file = i;
						var mds2d=mds_res['mds'][i];

						db_project.update(
							{ _id : new ObjectId( projectId),
								'files.name': vcf_file
							},     
							{  $set : {'files.$.mds2d': mds2d }}
						);
					}
			
				}

				db_project.findOne({ _id:  new ObjectId( projectId) },function(err, project){
								var files = project.files;

								io.sockets.in(client_id).emit( 'MDS_processing_done', { projectId: projectId, files: files  });
								lock_MDS_process=false;
				});
		
		});
	});

}

function Annovar_annotation(email, filename, projectId, client_id ){
	var vcf_file = "/data/temp_user_data/"+email+'/' + filename;
	ps_annovar = spawn('perl',['vcf_bin/table_annovar.pl', vcf_file, '/data/humandb/' , '-buildver','hg19', '-out','/data/temp_user_data/'+email+'/'+filename, '-remove', '-protocol', 'refGene', '-operation','g','-nastring','.', '-vcfinput' ] );

	ps_annovar.stdout.on('data', function(data){
		console.log( data );	
	});
	ps_annovar.stderr.on('data', function(data){
		console.log( 'stderr :' +  data );
	});
	
	ps_annovar.on('exit', function(data) {

			var QS_dist=[];
			var DP_dist=[];

			// Convert to JSON format file 
			var vcf_json={};
			vcf_json['SAMPLE'] = filename;
			vcf_json['VAR'] = [];
			var known_variants=0;
			var NS_AA_change=0;
			var numVariants=0;

			var vcf_annovar = fs.readFileSync(vcf_file+'.hg19_multianno.vcf');
			vcf_annovar=vcf_annovar.toString().split('\n');	
			vcf_annovar.pop();
			
			for( var i in vcf_annovar ){
				if( vcf_annovar[i].match( /^(#|\n|\s)/ ) ){
					continue;
				} else{
					var line = vcf_annovar[i].split('\t');
					var chr = line[0];
					var pos = line[1];
					var ref = line[3];
					var alt = line[4];
					var qual = Number(line[5]);
					numVariants++;
					
					var info_field = line[7].toString().split(';');
					for( var k in info_field ){
						var field = info_field[k].toString().split('=');
						if( field[0] =='Func.refGene' ){
							var region = field[1];
						}
						else if( field[0] =='DP' ){
							var dp = Number(field[1]);
						}
						else if(  field[0] =='Gene.refGene'){
							var gene = field[1];
						}
						else if( field[0] =='AAChange.refGene'){
							if( field[1].match(/:/)){
								var AA_field=field[1].split(',')[0].split(':').pop();
								if( AA_field.match(/\d/) ){
									var AA=AA_field.split('.')[1].split(/\d+/);
									var AA_ref = AA[0];
									var AA_alt = AA[1];

									if( AA_ref != AA_alt ){
										NS_AA_change++;
									}
								}
							} else{
								var AA_ref = 'NA';
								var AA_alt = 'NA';
							}
						}
						else if( field[0] =='snp138' ){
							if( field[1].length>1){
								var dbSNP = field[1];	
								known_variants++;
							}else{
								var dbSNP ='NA';
							}
						}
						else if(  field[0] =='clinvar_20140929' ){
							if( field[1].length > 1 ){
						
							}
						}

					}

					
					// VCF FORMAT field 
					var format = line[8].toString().split(':');
					var format_sample = line[9].toString().split(':');

					for( var k in format ){
						if( format[k] == 'GT' ){
							var gt = format_sample[k];
						}
						else if ( format[k] =='GQ'){
							var gq = format_sample[k];
						}
					}
				
					var VAR = [ [0], chr, pos, ref, [alt], [qual],[gq], [ dp], [gt], region , gene, 'anno',"ANNO_ALL", AA_ref, AA_alt , "TYPE", "CVAR", "CVAR_DESC", "CVAR_ACC", "CVAR_VER", dbSNP  ];

					if( chr.length > 5 ){
						continue;
					}
					vcf_json['VAR'].push( VAR );
					vcf_json['FIELD_NAME'] = ["sample_index", "CHR", "POS", "REF", "ALT", "QUAL", "GQ", "DP", "GT", "LOC", "GENE", "ANNO", "ANNO_ALL", "AA_REF", "AA_ALT", "TYPE", "CVAR", "CVAR_DESC", "CVAR_ACC", "CVAR_VER", "DBSNP"];
					//console.log('#'+ chr, pos, ref, alt, qual, dp ,region );
			
					// QS, DP distribution for file  summary
					var QS_ceil = Math.ceil(Number( qual  ));
					var DP_ceil = Math.ceil(Number( dp ));

					/*
					if( QS_ceil > 100 ){
						QS_ceil=100;
					}

					if( DP_ceil > 100 ){
						DP_ceil=100;
					}
					*/

					if( QS_ceil in QS_dist ){
						QS_dist[ QS_ceil ]+=1;
					} else{
						QS_dist[ QS_ceil ]  =1;
					}


					if( DP_ceil in DP_dist ){
						DP_dist[ DP_ceil ]+=1;
					} else{
						DP_dist[ DP_ceil]  =1;
					}


				}
			}

			var file={
				name: filename,
				class: 'Case',
				status:'complete',
				QS_dist : QS_dist, 
				DP_dist : DP_dist, 
				numNS_AA_change : NS_AA_change,
				numVariants: numVariants,
				known_variants : known_variants

			};

			db_project.update(
				{ 
					_id: new ObjectId( projectId),
					'files.name': filename	
				}, 
				{$set: 
					{
					 'files.$.status':'complete',
					 'files.$.QS_dist':  QS_dist,
					 'files.$.DP_dist': DP_dist , 
					 'files.$.numNS_AA_change': NS_AA_change,
					 'files.$.known_variants':known_variants
					}
				
				}
			);


			fs.writeFileSync( vcf_file.replace('.vcf','.json') , JSON.stringify(vcf_json));
			fs.writeFileSync( "VCFjsonS3/"+email+'/' + filename.replace('.vcf','.json') , JSON.stringify(vcf_json));
			
			io.sockets.in(client_id).emit( 'ANNOVAR_processing_done', { projectId: projectId, file : file  });
			console.log('### Annotation done');

	});
}

function annovar_annotation(email, filename, projectId, client_id ){
	// 1. convert2annovar.pl
	// 2. annotate_variation.pl via ANNOVAR server : http://54.197.27.191:3000/
	// 3. Merge annotation 

	var vcf_file = root_dir+"/data/temp_files/"+email+'/' + filename;
	var avinput = root_dir+"vcf_bin/temp_files/" + email+'_'+filename + ".avinput";
	
	// 1.convert
	ps_convert=spawn('perl',['vcf_bin/convert2annovar.pl','-format','vcf4',vcf_file,'-outfile',avinput] );
	ps_convert.on('exit', function(){
			// 2. ANNOVAR server request 
			request.post( ANNOVAR_server , {form:{email:email, filename: filename, avinput: avinput } } , function(){

				// 3. Merge 
			console.log('# 1 Merge ');
			 ps_merge=spawn('python',['vcf_bin/Merge_ANNOVAR_annotation.py'].concat(email+'_'+filename ) );

			 ps_merge.on('exit', function(){

				 convert2json(email, filename , projectId, client_id);;	
			 });


			});
			
	});

}

function convert2json(email, filename, projectId, client_id){
	console.log('# 2CONVERT ');
	var ps=spawn('python', ['vcf_bin/VCF_JSON_convert.py' ].concat(email,filename  ) );
	ps.on('exit', function(){
		console.log('# 3count ' );
		countVCFstats( projectId, email, filename , client_id);

		// MDS Distance calculation  :: Asynchronous process
		db_project.findOne({ _id: new ObjectId( projectId) }, function(err, project){
			var project_files=__.map( project.files, function(file){ return file['name'].replace(/\.vcf$/,'.json') })


			if( project_files.length < 2 ){

						db_project.update(
							{ _id: new ObjectId( projectId),
								'files.name': project.files[0]['name'] 
							},
							{ 
								 $set: { 'files.$.mds2d': [0,0]  } 
							}, 
							function( err, data ){
								console.log( filename, project_files.length, data); 
								db_project.findOne({ _id:  new ObjectId( projectId) },function(err, project){
								  var file = project.files[0];
									io.sockets.in(client_id).emit( 'file_processing_done', { projectId: projectId, file: file  });
								});
								
							}
						);
				
					/*
					db_project.findOne({ _id:  new ObjectId( projectId) },function(err, project){
						var file = project.files.pop();
						io.sockets.in(client_id).emit( 'file_processing_done', { projectId: projectId, file: file  });
					});
*/



			}
			else{
					var result_str='';
					var ps = spawn('python', ['vcf_bin/calculate_distance_btw_VCF.py', email, project_files.slice(-1), JSON.stringify(project_files.slice(0,-1)) ]);
					
					ps.stdout.on('data', function(data){
						result_str+=data;
					});

					ps.stderr.on('data', function(data){
						console.log('stderr :'+ data );
					});

					ps.on('exit', function(){
						// Save distance to DB 

						var dis_obj={};
						dis_obj = JSON.parse( result_str.replace(/\.json/g,''));

						db_project.update( 
							{ _id :  new ObjectId( projectId) },
							{ $addToSet: {'distance' : { $each : dis_obj } }	 }	,
							function(err, data){
								if( err ){
									console.log( err);
								}
								else{
									// Convert matrix to 2d coordinate 	
									updateMDS2d( projectId, client_id );	
								}

							}
						);
					});
				}

		});

	});

}

 
function updateMDS2d(projectId, client_id){
	  // Convert matrix to 2d coordinate 	
		// TODO
		db_project.findOne(
			{ _id :  new ObjectId( projectId) },
			{ distance:1},
			function( err, dis ){
				if( dis['distance'].length > 0 ){
					var mat2d='';
					ps_2d = spawn('python', ['vcf_bin/matTo2D.py', JSON.stringify( dis['distance']) ]);
					ps_2d.stdout.on('data', function(mat){
						mat2d+=mat;
					});
					ps_2d.stderr.on('data', function(data){
						console.log('stderr '+  data );
					});
					ps_2d.on('exit', function(){
						// Save to DB 
						mat2d=JSON.parse( mat2d);

						for( i in mat2d ){
							var filename = i;
							var file2d = mat2d[i];

							db_project.update(
								{ _id: new ObjectId( projectId),
									'files.name': i + '.vcf'
								},
								{ 
									 $set: { 'files.$.mds2d': file2d } 
								}
							);
						}
		
					db_project.findOne({ _id:  new ObjectId( projectId) },function(err, project){
							var files = project.files;
							io.sockets.in(client_id).emit( 'MDS_processing_done', { projectId: projectId, files: files  });
					});

						console.log('### DONE MDS distance calcuation ' + projectId );	
						
					});
				} else{
					

					console.log('### DONE MDS update ');
					
				}
			}
		);

}


function countVCFstats( projectId, user_email, filename , client_id ){

	var vcffile=fs.readFileSync( '/data/temp_user_data/'+user_email +'/'+filename.replace(/\.vcf$/,'\.json') );	
	//fs.createReadStream( 'VCFjsonS3/'+ user_email +'/'+filename.replace(/\.vcf$/,'\.json' ) ).pipe(fs.createWriteStream( '/data/temp_user_data/'+user_email  +'/'+filename.replace(/\.vcf$/,'\.json' )  ));

	var vcfjson = JSON.parse(vcffile);
	var num_variants = vcfjson.VAR.length;
	var QS_dist=[];
	var DP_dist=[];
	var chr_QS_dist={};
	var chr_QS_count={};
	var known_variants=0;

	var newVariantSet=[];

	for( i in vcfjson.VAR ){
		var variant = vcfjson.VAR[i];
		var chr= variant[1] ;
		var QS = Math.ceil(Number(variant[5]));
		var DP = Math.ceil(Number(variant[7]));
		var dbSNP = variant[20]; 
		newVariantSet.push( variant[1]+'-'+variant[2] );	

		if( dbSNP != 'NA' ){
			known_variants++;	
		}
		if( QS > 100 ){
			QS = 100;
		}
		if( DP > 100 ){
			DP = 100;
		}
		if( DP in DP_dist ){
			DP_dist[  DP  ] +=1; 
		} else{
			DP_dist[  DP  ] =1;
		}

		if( QS in QS_dist ){
			QS_dist[  QS  ] +=1; 
		} else{
			QS_dist[  QS  ] =1;
		}
	}

	var file={
		name: filename,
		class: 'Case',
		status:'complete',
		QS_dist : QS_dist, 
		DP_dist : DP_dist, 
		known_variants : known_variants,
		numVariants: num_variants

	};

	db_project.update({ 
		_id: new ObjectId( projectId)}, 
		{$addToSet: 
			{'files':  file  }
		
		}
	);

	console.log('DONE '+user_email +' '+filename +' '+ client_id);
	//io.sockets.connected[client_id].emit( 'file_processing_done', { projectId: projectId, file:file });
	//io.sockets.in(client_id).emit( 'file_processing_done', { projectId: projectId, file:file});
 
}

app.post('/api/saveNewProject', function( req, res){

	var data = req.body; 
	//data['user'] = req.user.id ; 

	// add user to project 
	db_project.insert(
		data
	, function( err, insertedRow){
		insertedRow._id = insertedRow._id.toString();
		res.json( insertedRow );

	});


});


app.post('/api/deleteFile', function( req, res){
	var projectId = req.param('projectId');
	var deleteFilename = req.param('filename');
	var client_id = req.param('client_id');

	// TODO 
	db_project.update(
		{
			_id: new ObjectId( projectId )
		},
		{
			$pull : {
				'distance':{
					'pair':{
						 $regex : deleteFilename
						 }
					}
				}
		},
		function(){
			updateMDS2d(projectId, client_id);
		}
	);
	
	db_project.update(
		{
			_id: new ObjectId( projectId )
		},
		{
			$pull :{  files: { name: deleteFilename}   }
		},
		function( err, result ){
			if( !err ){
				res.json( result );
			}
		}
	);


});

app.get('/api/getUserProjects', function(req,res){

	db_project.find({'users.email': req.user.id  }).toArray(  function(err, array){
		if( err ){
			console.log( err) ;
		}else{
			var data=array;
			for(var i=0; i<array.length; i++){
				data[i]._id=array[i]._id.toString();
			}
			res.json(data );
		}
	});	
});

app.post('/api/addUser', function(req, res){
	var user_email = req.user.id;
	var email = req.param('email');
	var projectId = req.param('projectId');
	var projectTitle = req.param('title');
	var mailOption={};
	var newUser={
		email:email, 
		role:'Audit',
		status:'invited'
	};

	var sendMail = function(option){
		mailSender.sendMail(option, function( err, info){
			if( err ){
				res.end('error');
			} else{
				res.send(newUser);
			}
		});

	};
	// Check if invitee is new user 
	db_user.findOne({'email': email } , function( err, data){
		if( data ){
			// Add user to project 
			newUser.status='confirmed';

			db_project.findOne({ 'users.email': email }, function(err, data){
				if( data){
					res.end('current_user');

					db_project.update(
					{ _id: new ObjectId(projectId) }, 
					{ $push: {  users: newUser   }   }
					);

					mailOption = {
						from: 'VCF viewer <contact@geference.com>',
						to: email,
						subject: 'Invitation to VCFviewer project',
						text:user_email+' invited you to project : '+ projectTitle+ '\n' 
					};
					sendMail( mailOption);

				}
			});

		} else{

			db_project.update(
			{ _id: new ObjectId(projectId) }, 
			{ $push: {  users: newUser   }   }
			);

			mailOption = {
				from: 'VCF viewer <contact@geference.com>',
				to: email,
				subject: 'Invitation to VCFviewer project',
				text:user_email+' invited you to project : '+ projectTitle+ '\n' +'To confirm invitation click http://54.65.43.210:7777/invite/'+email+'/'+projectId 
			};
			sendMail( mailOption);
		}

	});
});


app.get('/invite/:email/:project', function(req,res) {
	var email = req.param('email');
	var projectId = req.param('project');
	var make_passwd = function(n, a) {
	 var index = (Math.random() * (a.length - 1)).toFixed(0);
	 return n > 0 ? a[index] + make_passwd(n - 1, a) : '';
	};
	var pw= make_passwd(8, 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890');
	var sha1=  crypto.createHash('sha1') ;
	sha1.update(pw);
	var pw_sha1 = sha1.digest('hex');



	db_project.findOne({ _id: new ObjectId(projectId), 'users.email':email}, function(err, data){
		if( data  ){
			// Add user 
			var user={ 
				created: new Date(),
				email: email,
				ip:  req.ip,
				pw:pw_sha1
			};

			db_user.insert( user, function(err, result ){
				if( err ){
					db_user.update(
						{ email: email },
						{ $set: {  pw: pw_sha1 } }
					);
				}
			});

			db_project.update(
				{ 'users.email': email },
				{ $set: {  'users.$.status': 'confirmed' } }
			);

			// response with login information  
			res.end('Verification completed! Your login information has sent to your email address'  );

			mailOption = {
					from: 'VCF viewer <contact@geference.com>',
					to: email,
					subject: 'Welcome to VCFviewer project',
					text:"Login with your temporary password : "+ pw
			};

			mailSender.sendMail(mailOption, function( err, info){
				if( err ){
					res.end('error');
				} else{
					res.end();
				}
			});
			

		}
	});
	
});


app.post('/api/getProjectChat', function(req,res){
	
	console.log( req.body );

	db_chat.find( { projectId: req.param('projectId') } ).toArray( function(err, array){
		res.json( array );
	});

});

app.post('/api/saveChat', function(req,res){


	var insertData=req.body;
	insertData['user'] = req.user.id;

	db_chat.insert(insertData , function(err, result){
		db_chat.find( { projectId: req.param('projectId') } ).toArray( function(err, array){
			console.log( array );
			res.json( array );
		});
	});
});

app.get('', function(req,res ){
	// Confirm user invitation 
	// Create user account 
	var user; 

	db_user.insert({

	}, function(){
	
	});

});

app.post('/api/getProject', function(req,res){
	var projectId = req.param('id');

	db_project.findOne({ user: req.user.id, _id: new ObjectId( projectId )}, function(err, data){
		res.json( data );
	});	
});

app.post('/login', function(req,res){
	var id=req.param('id');
	var pw= req.param('pw');
	var sha1=  crypto.createHash('sha1') ;
	sha1.update(pw);
	var pw_sha1 = sha1.digest('hex');

	db_user.findOne({ email:id, pw:pw_sha1}, function(err,result){
			var profile={
				id:id
			};

		if( typeof result == 'object' ){
			var token = jwt.sign(profile, secret ,{ expiresInMinutes:60*5});
			res.json({ token:token} );

			// Copy user's a project vcf, json files to local
			var local_user_dir = '/data/temp_user_data/'+id+'/';
			if( !fs.existsSync( local_user_dir ) ){
					fs.mkdirSync( local_user_dir );	
			}


			db_project.find( {'users.email':id  } ).toArray( function(err, array){
				for( i in array ){
					var project_owner = array[i].users[0].email;
					var dir = 'VCFjsonS3/'+project_owner+'/';
					for( j in array[i].files ){
						//console.log( project_owner, array[i].files[j].name );

						var vcf_name= array[i].files[j].name ;
						var json_name= vcf_name.replace(/\.vcf/,'.json');
						fs.createReadStream(dir+vcf_name ).pipe(fs.createWriteStream(local_user_dir+vcf_name));
						fs.createReadStream(dir+json_name ).pipe(fs.createWriteStream(local_user_dir+json_name));
					}
				}
			});
			/*
			var files = fs.readdirSync(dir);
			for( i in files ){
				if( /(\.json|\.vcf)$/.test(files[i])){
					console.log( files[i] );
					var local_user_dir = '/data/temp_user_data/'+id+'/';
					if( !fs.existsSync( local_user_dir ) ){
							fs.mkdirSync( local_user_dir );	
					}
					fs.createReadStream(dir+files[i] ).pipe(fs.createWriteStream(local_user_dir+files[i]));
				}
			}
			*/


		

			// Delete local user json files 
			setTimeout( function(){
				 for( i in files ){
				 	if( /\.json$/.test(files[i])){  
				 		fs.unlinkSync(local_user_dir+files[i]);
					}
				 }	
			}, 60*5*1000);

		} else{
			res.send(401);
		}
	});

});

app.get('/api/logout', function(req,res){
		var local_user_dir = '/data/temp_user_data/'+req.user.id+'/';
		var files = fs.readdirSync(local_user_dir);
		for( i in  files ){
			fs.unlinkSync( local_user_dir +  files[i] );
		}

});

app.get('/api/restricted', function( req, res ){
	if( req.user.id){
		res.json({
			user: req.user.id
		});
	}
});

app.post('/api/updateProjectContent', function(req, res){
	var projectId = req.param('projectId');
	var attr = req.param('attr');
	var content = req.param('content' );

	var updateData={};
	updateData[ attr ] = content  ;

	db_project.update(
		{ _id :new ObjectId( projectId) }, 
		{ $set : updateData  }, 
		function(err,result   ){
			if( err ){
				res.end('error');	
			}else{
			console.log();
				res.end('updated');
			}
	
	});
});


app.post('/api/updateFileClass'  , function( req, res ){
	var projectId = req.param('projectId');
	var file = req.param('file');
	var Class = req.param('class' );
	
	console.log('@@@ update ' . file, Class );

	db_project.update( 
		{  _id :new ObjectId( projectId) ,
			 'files.name' : file
		},
		{
			$set: {'files.$.class': Class  } 
		},
		function(err, result ){
			if( err ){
				res.end('error');	
			}else{
				res.end('updated');
			}

		}
	);

});


app.post('/register_user', function(req, res) {

	var ip= req.ip;
	var id=req.param('id');
	var pw= req.param('pw');
	var sha1=  crypto.createHash('sha1') ;
	sha1.update(pw);
	var pw_sha1 = sha1.digest('hex');

	db_user.insert( {
		email:id,
		pw:pw_sha1,
		created :new Date()
	}, function(err, insertedRow){
		if( err){
			console.log(id,pw, err );
			res.end('fail');
		}else{
			res.end('ok');
		}
	});	

	request.get('http://freegeoip.net/json/'+ip, function(err,result,data){
		var loc=JSON.parse(data);
		db_user.update({email: id}, {$set :{ country: loc.country_name } } );
			
	});
});

app.post('/api/deleteProject', function(req, res){
	var projectId = req.param('projectId');
	var deleteFiles = req.param('deletefiles');
	var user_email = req.user.id; 


	/*
	if( deleteFiles ){
		for( var i=0; i<deleteFiles.length; i++){
			var deleteFileJson = deleteFiles[i].replace(/\.vcf$/, '\.json');
			console.log( deleteFileJson );
			//fs.unlinkSync(  'VCFjsonS3/'+ user_email+"/"+ deleteFileJson  );
		}
	}
	*/
	// Delete project entry in DB
	db_project.remove({ _id: new ObjectId( projectId)  }, function(err, result){
		if( err){
			res.end('fail');
		}else{
			res.end('ok');
		}
	});
});

app.post('/api/getMergedFile', function(req,res){
	var case_vcf=req.param('case');
	var control_vcf=req.param('control');
	var user_email = req.user.id;

	case_input=case_vcf.join('  ').replace(/(\s|^\b)(?=\w)/g,'/data/temp_user_data/'+user_email+'/').replace(/.vcf\b/g,'.json').split(' ');
	control_input=control_vcf.join('  ').replace(/(\s|^\b)(?=\w)/g,'/data/temp_user_data/'+user_email+'/').replace(/.vcf\b/g,'.json').split(' ');

	
	var merged_json=[];

	var merge_json=function ( json_array, callback ){
		if( json_array.length <2 ){
			data=fs.readFileSync( json_array[0] ,'utf8');
			merged_json.push( data );
			callback( merged_json);
		}
		else{
			console.log( json_array);
			var ps=spawn('python',['vcf_bin/merge_VCF_json.py'].concat(json_array ) );
			ps.stdout.on('data', function( data ){
				merged_json.push( data );
				callback( merged_json);
			});
			ps.stderr.on('data', function(err){
				console.log('Error ::'+err);
			});
		}
	}


	function return_merged_files(data){
		if( data.length == 2 ){
			res.send( merged_json );
		}
	}
	
	merge_json( case_input, return_merged_files ); 
	merge_json( control_input, return_merged_files ); 


});

app.post('/api/getFile', function(req,res){
	var file = req.param('file');
	var user = req.user.id; 
	var local_json_file = '/data/temp_user_data/'+user+'/'+file; 

	console.log( local_json_file );
	var resFile= fs.readFileSync(local_json_file)  ;
	res.send( resFile );

});

app.post('/api/getClassFiles', function(req,res){
	var classes=req.param('classes'); 
	var projectId = req.param('projectId');
	var user_email = req.user.id; 
	var classFiles=[];
	var merged_json={};
		
	console.log( ' Start merge ');

	db_project.find( { _id:new ObjectId( projectId ) }, { files:1  }).toArray( function(err,data ){
		var files=data[0].files;
	
		for( i in files ){
			for( j in classes ){
				if( files[i].class == classes[j] ){
					if( !classFiles[classes[j] ] ){
						classFiles[ classes[j] ] =[] ;
					}
					classFiles[ classes[j] ].push( files[i].name );
				} 
			}
		}

		
		for( i in classFiles){

			classFileNameCombined=classFiles[i].join('  ').replace(/(\s|^\b)(?=\w)/g,'/data/temp_user_data/'+user_email+'/').replace(/.vcf\b/g,'.json').split(' ');

			console.log(i, classFileNameCombined);	
			merge_json( i , classFileNameCombined , return_merged_files);

		}
		
	
	}); 


	var merge_json=function ( class_name, json_array, callback ){
			var file='';
			ps=spawn('python',['vcf_bin/merge_VCF_json.py', class_name ].concat( json_array ) );
			ps.stdout.setEncoding('utf8');
			ps.stdout.on('data', function( data ){
				file+=data;
			});
			ps.stderr.on('data', function(err){
				console.log('Error ::'+err);
			});
			ps.on('exit', function(code){
				merged_json[ class_name] = file ;
				callback( merged_json);
			});
	}


	function return_merged_files(data){
		if( Object.keys(data).length == classes.length ){
			res.send( merged_json );
		}
	}
	
});




app.post('/userdata:userID', function( req, res) {
	res.senf( file );
});


/// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		 res.status(err.status || 500);
		 res.render('error', {
				message: err.message,
				error: err
		 });
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		 message: err.message,
		 error: {}
	});
});



module.exports = app;
