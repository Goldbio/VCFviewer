var app=angular.module('frontPage', ['ngRoute','angularFileUpload']);
var url_root='http://54.197.27.191:7777';
app.factory('authInterceptor', function( $rootScope, $q, $window){
			return{
				request: function(config){
					if( $window.sessionStorage.token ){
						config.headers.Authorization ='Bearer '+$window.sessionStorage.token; 
					}
					return config; 
				},
				responseError: function( rejection){
					if( rejection.status == 401 ){
						
					}	
					return $q.reject(rejection);
				}
			};
});

app.service('sessionOn', function($window){
	this.validToken=false;

	this.getUsername= function(){
		return $window.sessionStorage.id;
	};
	
	this.deleteToken = function(){
		delete $window.sessionStorage.token; 
	};
});

app.service('selectedProject', function(){
	this.projectId='' ;
	this.title='';
	this.files=[]; 
});

app.config( function( $routeProvider, $httpProvider ){
				$routeProvider
				.when('/', {templateUrl:'template/home.html' } )
				.when('/signup',{templateUrl:'template/signup.html', controller:'signupCtrl'})
				.when('/login', { templateUrl:'template/login.html', controller:'loginCtrl' })
				.when('/dashboard_temp', { templateUrl:'template/dashboard.html', controller: 'dashboardTempCtrl'})
				.when('/projectedit',{ templateUrl:'template/projectedit.html', controller:'projectEditCtrl'})
				.when('/project/:projectId', { templateUrl:'template/projectview.html',controller:'projectViewCtrl' })
				.when('/vcfexplore', { templateUrl:'template/vcfexplore.html', controller:'vcfexploreCtrl' })
				.otherwise({ redirectTo:'/'}); 

				$httpProvider.interceptors.push('authInterceptor');
				//$httpProvider.defaults.headers.post['Content-type'] ='application/x-www-form-urlencoded';
				$httpProvider.defaults.headers.post['Content-Type'] ='application/json';
				$httpProvider.defaults.headers.common['Accept'] ='application/xml';

				//$locationProvider.html5Mode(true);
		});



// Controller 
app.controller('statusBarCtrl', function($scope, $http,sessionOn){
		
		$scope.validToken = sessionOn.validToken;

		$http({url: '/api/restricted', method: 'GET'})
			.success(function (data, status, headers, config) {
				sessionOn.validToken=true;
				$scope.validToken = sessionOn.validToken;
			})
			.error( function(){
				sessionOn.validToken=false;

			});
	
		$scope.$watch( function(){ 
				return sessionOn.validToken;
			},function( newValue, oldValue ){
				$scope.validToken = sessionOn.validToken;
				$scope.username= sessionOn.getUsername();	
		});

		$scope.logout = function(){
			$http({url: '/api/logout', method: 'GET'});
			sessionOn.validToken=false;
			sessionOn.deleteToken();
		};
		
	})
	.controller('dashboardIntCtrl', function( $scope, $http, selectedProject, sessionOn, $window,$compile, FileUploader ){
	
		$http({url: '/api/getUserProjects', method: 'GET'})
		.success(function (data, status, headers, config) {
			$scope.userProject= data; 
			$scope.showProject(0);
		})
		.error( function(){
			sessionOn.validToken =false;
			$window.location.href='/';
		});

		$scope.addProject = function(){
			if( $scope.userProject.length <1 || $scope.userProject.slice(-1)[0]._id ){
				$scope.userProject.push(
					{
						date:( new Date()).toISOString(),
						title:'',
						files:[],
						class:['Case','Control'],
						summary:'',
						users:[
							{
								email:sessionOn.getUsername(),
								role:'Admin'
							}	
						]
					}
				);
			}
		
			$scope.index=$scope.userProject.length-1;
			$scope.showProject(0); 
			$scope.showDiscuss();
		
		};

		$scope.showProject= function(index){
			$scope.index= $scope.userProject.length - 1 - index;
			if( $scope.userProject.length < 1){
				$scope.addProject();
				$('#vcfPane').html('');
			} else{
			
				if( $scope.index < 0 ){
					$scope.index+=1;
				}
				$('#title > div').text( $scope.userProject[$scope.index].title );
				$('#summary > div').text( $scope.userProject[$scope.index].summary );

				// TODO 
				// Display project view 
				var totQS=0, totDP=0, totSNP=0, totVariants =0, maxMeanQS=0, maxMeanDP=0, maxVariants=0;
				for( i in $scope.userProject[$scope.index].files ){
					var vcf=$scope.userProject[$scope.index].files[i];
					totQS+=vcf.totQS;
					totDP+=vcf.totDP;
					totSNP+=vcf.totSNP;
					totVariants+=vcf.numVariants; 


					maxVariants=Math.max( maxVariants, vcf.numVariants ); 
					maxMeanQS = Math.max( maxMeanQS, vcf.totQS / vcf.numVariants );
					maxMeanDP = Math.max( maxMeanDP, vcf.totDP / vcf.numVariants );

				}

				$scope.maxVariants = maxVariants; 
				$scope.maxMeanQS = maxMeanQS;
				$scope.maxMeanDP = maxMeanDP;
				$scope.totSNP = totSNP;
				
				$scope.projectQS = totQS/totVariants;
				$scope.projectDP = totDP/totVariants;
				$scope.totVariants = totVariants;

				// Default view : single file view on the first vcf file in the project 
				$scope.plotSinglePane( $scope.userProject[$scope.index].files[0].name, 'file');
				// Sample overview Chart 
			}

		};


		$scope.deleteProject = function(){

			if( $scope.userProject[$scope.index]._id ){
				$http({
					url:'/api/deleteProject',
					data:{  
						projectId: $scope.userProject[$scope.index]._id,
						deletefiles : $scope.userProject[$scope.index].files	
					},
					method:'post'
				})
				.success( function( data, status ){
					$scope.userProject.splice( $scope.index,1 );
					$scope.showProject( $scope.userProject.length-$scope.index  );
					$scope.showDiscuss();
				});
			} else{
			}
		};

		$('.file-download').on('hidden.bs.modal', function(){
				$('.file-download .progress-bar').css('width', 0);
		});

		$scope.plotSinglePane= function(name, type){
			if( type =='file'){
				if(VCF.hasData( name)  ){
					VCF.drawSingleView('#filePane', name );
				}else{
					$scope.plotVCF( name );
				}
			}else{
				if( VCF.hasData( name ) ){
					VCF.drawSingleView('#filePane', name );
				} else{
					$('.file-download').modal('show');
					$.ajax({
						xhr: function(){
							var xhr = new window.XMLHttpRequest();
							xhr.addEventListener("progress", function(evt) {
								if (evt.lengthComputable) {
									var percentComplete = evt.loaded / evt.total*100;
									$('.file-download .progress-bar').css('width',percentComplete +'%' );
								}
								
							}, false);
							return xhr;
						}, 
						url:'/api/getClassFiles',
						headers: {
							'Authorization' : 'Bearer '+$window.sessionStorage.token
						},
						type: 'post', 
						data: {
							projectId: $scope.userProject[ $scope.index]._id,
							classes: [ name]
						},
						success:  function(data  ){
							setTimeout( function(){
								$('.file-download').modal('hide');
								VCF.addData( name, JSON.parse( data[name] ) );
								VCF.drawSingleView('#filePane', name );
							}, 1000);

						}
					});
				}
			}
		};



		$scope.plotVCF= function(selectedVCFfile){
			
			var VCFjsonFilename=selectedVCFfile.replace(/vcf$/,'json');

			$('.file-download').modal('show');

			$.ajax({
				xhr: function(){
					var xhr = new window.XMLHttpRequest();
					xhr.addEventListener("progress", function(evt) {
						if (evt.lengthComputable) {
							var percentComplete = evt.loaded / evt.total*100;
							$('.file-download .progress-bar').css('width',percentComplete +'%' );
						}
						
					}, false);
					return xhr;
				}, 
				type: 'get',
				url:'http://vcfjson.s3.amazonaws.com/'+  sessionOn.getUsername()  +'/'+VCFjsonFilename,
				success: function( vcfjson ){
					
					setTimeout( function(){
						$('.file-download').modal('hide');
						VCF.addData( selectedVCFfile, vcfjson );
						VCF.drawSingleView('#filePane', selectedVCFfile); 
					
					
					},1000);
					
				}
			});
		};


		$scope.plotGroupVCF = function(){
			var case_vcf=[], 
				control_vcf=[];
		
			$('.file-download').modal('show');

			$('#files table tr input:checked').each( function(){
				var filename = $(this).attr('name');
				if( $(this).hasClass('case') ){
					case_vcf.push( filename);
				} else{
					control_vcf.push( filename);
				}
			});

	
			// Merge files and plot 
			$.ajax({
				xhr: function(){
					var xhr = new window.XMLHttpRequest();
					xhr.addEventListener("progress", function(evt) {
						if (evt.lengthComputable) {
							var percentComplete = evt.loaded / evt.total*100;
							$('.file-download .progress-bar').css('width',percentComplete +'%' );
						}
						
					}, false);
					return xhr;
				}, 
				url:'/api/getMergedFile',
				headers: {
					'Authorization' : 'Bearer '+$window.sessionStorage.token
				},
				type: 'post', 
				data: {
					case: case_vcf ,
					control: control_vcf
				},
				success:  function(data  ){
					_data = {_TEMP: []} ; 
				
					setTimeout( function(){
						$('.file-download').modal('hide');

						VCF.addData('case', JSON.parse(data[0]));
						VCF.addData('control', JSON.parse( data[1] ));

						VCF.drawGroupView('#vcfPane', 'case','control');
					},1000);
				}
			});
		
		};

		$scope.showDiscuss = function( ){
			$http({
				url:'/api/getProjectChat',
				method:'post',
				data:{ projectId : $scope.userProject[$scope.index]._id }
			})
			.success( function( data, status ){
				$scope.chatlog = data;
			});
		};


		$scope.deleteFile = function( filename ){
			$http({
				url:'/api/deleteFile',
				data:{
					projectId : $scope.userProject[$scope.index]._id,
					filename : filename
				},
				method:'post'
			})
			.success( function( data, status ){
				for(var i=0; i< $scope.userProject[$scope.index].files.length; i++){
					if( $scope.userProject[$scope.index].files[i] == filename ){
						$scope.userProject[$scope.index].files.splice( i, 1 );
					}
				}
			});
		};


		$scope.addClass = function(className, e){
			e.stopPropagation();

			if( className ){
				var hasClass=_.filter( $scope.userProject[$scope.index].class, function(name){ return name == className});
				if( hasClass.length == 0){
					$scope.userProject[$scope.index].class.push( className );

					$http({
						url:'/api/updateProjectContent',
						data:{
							projectId : $scope.userProject[$scope.index]._id,
							attr:'class',
							content: $scope.userProject[$scope.index].class
						} , 
						method:'post' 
					})
				}
			}
		};

		$scope.selectCalcClass= function( selectedclass,e){
			$(e.target).parent().parent().siblings('button').find('.selectedClass').text( selectedclass );
		
		};

		$scope.selectCalcOperator= function( selectedOperator,e){
			$(e.target).parent().parent().siblings('button').find('.selectedOperator').text( selectedOperator );
		
		};

		$scope.addCalc = function(e){
			$(e.target).before( $compile("<add-operator-html></add-operator-html><add-class-html type='control'></add-class-html> ")($scope) );
		};

		$scope.setFileClass= function( filename, fileClass) {
			for( i in $scope.userProject[$scope.index].files){
				if( $scope.userProject[$scope.index].files[i].name == filename ){
					var preClass= $scope.userProject[$scope.index].files[i].class;

					if( preClass != fileClass ){
						$scope.userProject[$scope.index].files[i].class=fileClass; 
						$http({
							url:'/api/updateFileClass',
							data:{
								projectId: $scope.userProject[$scope.index]._id,
								//attr:'files',
								//content: $scope.userProject[$scope.index].files 
								file : filename, 
								class : fileClass 
							},
							method:'post'
						})
						.error( function(){
							$scope.userProject[$scope.index].files[i].class= preClass; 
						})
						.success( function(data, status){
							VCF.removeData( fileClass);
							VCF.removeData( preClass  ); 
							if( $('.menu_selected').find('p').text()=='Overview' ){
								$scope.showOverview();
							}


						});
						break;
					}
				}
			}
		
		};


		$scope.doCalc = function(){
			var classes4Download=[], operators=[], classes4Calc=[];

			$('#calceditor .selectedClass').each( function(i,dom){
				var selectedClass = $(dom).text().trim() ;
				if( ! VCF.hasData( selectedClass ) ){
					classes4Download.push( selectedClass );
				}
				classes4Calc.push( selectedClass );
				
			});

			$('#calceditor .selectedOperator').each( function(i,dom){
				operators.push( $(dom).text().trim() );
			});

			
			if( classes4Download.length > 0){

				$http({
					url:'/api/getClassFiles',
					method:'post',
					data:{
						projectId: $scope.userProject[$scope.index]._id,
						classes: classes4Download
					}
				})
				.success( function( data ){

					for(i in data){
						VCF.addData( i , JSON.parse(data[i]) ); 
					}

					showResult();
				});
			} else{
				showResult();
			}

			function  showResult(  ){
				var calculator=[];
				// Display first  Merged VCF
				//VCF.drawSingleView('#singlePane', classes4Calc[0] ); 
					
				// VCF group operation 
				calculator.push( classes4Calc.shift() );
				for(i in operators){
					calculator.push( classes4Calc.shift() );

					console.log( calculator, operators[i] );
					switch( operators[i] ){
						case '∩' : 
							VCF.addData('result',VCF.intersection( calculator[0], calculator[1] ));
							break;
						case 'U' :
							VCF.addData('result',VCF.union( calculator[0], calculator[1] ));
							break;
						case '-':
							alert('-');
							VCF.addData('result',VCF.difference( calculator[0], calculator[1] ));
					}
				
					calculator.splice(0,2);
					calculator.push('result');
					
					var res=VCF.getData('result');
					console.log(  res );

				}

				// Display operation result 
				VCF.drawSingleView('#groupPane', 'result');

			};
		

		};

		// Anguular-file-uploader 
		uploader=$scope.uploader = new FileUploader({
			url:'/api/upload',
			headers:{
				'Authorization' : 'Bearer '+$window.sessionStorage.token
			}
		});

		uploader.onAfterAddingFile = function(item) {
			var isUploaded=_.find( $scope.userProject[$scope.index].files, function(file){ return file.name==item.file.name  });
			if( isUploaded  ) {
				alert( item.file.name +' was already uploaded');
				uploader.removeFromQueue( item );
			}
			else{
				item.formData.push( { 
					projectId: $scope.userProject[$scope.index]._id,
					class : 'Case'
				} );
				uploader.uploadItem( item);
			}
		};

		uploader.onBeforeUploadItem = function( item){
		};

		uploader.onCompleteItem= function(item){
		};

		uploader.onCompleteAll= function(){
			var uploadedFiles=$scope.userProject[$scope.index].files;
			for( i in uploader.queue){
				var fileItem={};
				var item = uploader.queue[i];
				fileItem['name']= item.file.name;
				fileItem['class']='Case';
				uploadedFiles.push( fileItem  );

			}
			uploader.clearQueue();
			$scope.userProject[$scope.index].files= uploadedFiles;
		};


		// Update project content 

		$('[contenteditable]').on('focusout', function(){

			var content = $(this).text();
			var attr = $(this).attr('name');
			var projectId = $scope.userProject[$scope.index]._id ;


			$scope.userProject[$scope.index][attr]= content;

			if( projectId ){

				$http({
					url:'/api/updateProjectContent',
					data:{
						projectId: projectId,
						attr : attr, 
						content : content 
					},
					method:'post'
				})
				.success( function(data, status ){
					
				});
			} else{

				$http({
					url:'/api/saveNewProject', 
					data:   $scope.userProject[$scope.index],
					method:'post'
				})
				.success( function( newProject, status ){
					$scope.userProject[$scope.index]._id = newProject._id;
				});
			}
		});
	
	
		// Post discussion 
		$('#members .row textarea').on('keypress', function(e) {
			if( e.which == 13 ){
				$scope.submitChat();
			} 	
		 
		});

		$scope.submitChat = function(){
			$http({
				url:'/api/saveChat',
				data:{
					projectId: $scope.userProject[ $scope.index]._id,
					date: new Date(),
					chat: $scope.chat
				},
				method:'post'
			})
			.success( function( data, status ){
				$scope.chatlog = data;	
				$('#members .row textarea').val('');
			});
		};

	



	})
	.controller('vcfexploreCtrl', function($scope, $http, $routeParams, selectedProject, sessionOn, $window ){
		$scope.projectId= selectedProject.projectId; 
		$scope.files = selectedProject.files;
		$scope.title = selectedProject.title;
		$scope.mode=0; 


		if( !sessionOn.validToken ){
			$window.location.href='/';
		}

		$scope.displaySingleVCF = function( selectedFile ){
			$('.vcf_pane').html('');
			$('#file_dropdown_title').html( selectedFile );
			var VCFjsonFilename=selectedFile.replace(/vcf$/,'json');


			$.get('http://vcfjson.s3.amazonaws.com/'+  sessionOn.getUsername()  +'/'+VCFjsonFilename,function(vcfjson){

					//var vcf = new VCF(vcfjson);
					VCF.addData( selectedFile , vcfjson );
					vcf.drawSummary('.l_1');
					vcf.drawQualChart('.l_2');    
					vcf.drawDPChart('.l_3');
					vcf.drawDataTable('.r_1');
			});
		};			

		$scope.goDashboard = function(){
			$window.location.href='#dashboard_temp'
		};
		$scope.changeViewMode= function( mode ){
			if( mode ){
				// Group comparison
				$('#mode-dropdown-title').html('Group Comparison');
				$scope.mode =1;
			} else{
				// Single VCF explore 
				$('#mode-dropdown-title').html('Single VCF explore');
				$scope.mode=0;
			
			}
		};
		$scope.displaySingleVCF($scope.files[0]);
		
	})
	.controller('projectViewCtrl', function($scope, $fileUploader, $routeParams, $http, sessionOn, $window,selectedProject ){

		if( !sessionOn.validToken ){
			$window.location.href='/';
		}

		$scope.projectId= $routeParams.projectId; 

		$http({
			url:'/api/getProject',
			method:'POST',
			data:{ id : $scope.projectId }
		})
		.success( function(data, status ){
			$scope.title = data.title;
			$scope.summary = data.summary;
			$scope.files = data.files;
			$scope.date = data.date; 
			$scope.user = sessionOn.getUsername(); 
			selectedProject.projectId = $scope.projectId;
			selectedProject.files = data.files;
			selectedProject.title= data.title;
		});

		$scope.startVCFviewer = function(){
			$window.location.href='#vcfexplore/'; 	
		};

		$scope.deleteFile = function( file ){
			$http({
				url:'/api/deleteFile',
				method:'post',
				data:{
					filename: file,
					projectId : $scope.projectId
				}
			})
			.success( function( result, status){
				// Update project file list 
				if( result ){
					for(var i=0; i< $scope.files.length ; i++){
						if( $scope.files[i] == file ){
							$scope.files.splice(i,1);
						}
					}
				
				}
			});
		
		};

	})
	.controller('projectEditCtrl' , function($scope, $fileUploader, $window,$http){
		// Check if given files are valid VCF files
		var regexVCFformat=/^#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\tFORMAT\t/m;
		var isVCFfile={};

		$scope.checkValidVCF = function( $filesContent ) {
			isVCFfile[ $filesContent.name]=  regexVCFformat.test( $filesContent.content ) ;
		};

		$scope.isVCF = function( file ){
			return isVCFfile[file];
		};

		$scope.createProject = function(){
			if( uploader.queue.length ){
				uploader.uploadAll();
				$('.btn-loading').button('loading');
			} else{
				$('#noVCFAlert').modal();
			}
		}
		// File upload  using angularfileupload library
		$scope.doneUpload=false;

		var uploader = $scope.uploader = $fileUploader.create({
            scope: $scope,
			url:'/api/upload',
			headers:{
				'Authorization' : 'Bearer '+$window.sessionStorage.token
			}
        });
	
		uploader.bind('error', function (event, xhr, item, response) {
        });

		uploader.bind('beforeupload', function( event, item, xhr){
			item.formData.push( { 
				title: $scope.project_title ,
				summary: $scope.project_summary	
			} );
		});

	    uploader.bind('afteraddingfile', function (event, item) {
            console.info('After adding a file', item.file.name +' '+ item.file.size);
        });

		uploader.bind('completeall', function( event, items){
			$scope.doneUpload=true;	
			$('.btn-loading').button('reset');

			var title = items[0].formData[0].title;
			var summary = items[0].formData[0].summary;

			var uploadedFiles=[];
			for( var i=0; i<items.length; i++){
				uploadedFiles.push( items[i].file.name );
			}
			

			$http( {
				url:'/api/saveNewProject', 
				data:{ title: title, summary:summary, files: uploadedFiles  }, 
				method:'POST' 
			})
			.success( function( data, status, headers, config){
			
			});
		});	

	})
	.controller('dashboardTempCtrl', function( $scope, $http, selectedProject, sessionOn, $window,$compile, FileUploader ){

		
		$http({url: '/api/getUserProjects', method: 'GET'})
		.success(function (data, status, headers, config) {
			$scope.userProject= data; 
			$scope.showProject(0);
			$scope.restrict=false;
			$scope.loggedUser = sessionOn.getUsername();
			var user = $window.sessionStorage.id;
			for( i in $scope.userProject[ $scope.index ].users ){
				if( $scope.userProject[ $scope.index ].users[i].email == user  ){
					 if($scope.userProject[ $scope.index ].users[i].role !='Admin'){
					 	$scope.restrict=true;
					 }
					
				}
			}
		})
		.error( function(){
			sessionOn.validToken =false;
			$window.location.href='/';
		});

		
		$('.project-select-btn').click( function(){
			if( $('#project_select_box').css('z-index') ==5 ){
				 $('#project_select_box').css('z-index',-1);
			}else{
				 $('#project_select_box').css('z-index',5);
				
			}
		});	

		$('.filter-btn').click( function(){
			if($('#filter_box').hasClass('col-xs-push-9') ){
				$('#filter_box').removeClass('col-xs-push-9');
				$('#filter_box').addClass('col-xs-push-6');
			}else{
				$('#filter_box').addClass('col-xs-push-9');
				$('#filter_box').removeClass('col-xs-push-6');
			
			}
		});

	
		$('.menu').click( function(){
			$('.menu').removeClass('menu_selected');
			$(this).addClass('menu_selected');
			//$('#filter_box').removeClass('col-xs-push-6');
			//$('#filter_box').addClass('col-xs-push-9');
			$('#project_select_box').css('z-index',-1);

			// Empty variant table
			$('.plot_summary').empty();
			$('.plot_table').empty();

			switch($(this).index()) {
				case 0:
					$('#variants_content').addClass('hidden');
					$('#overview_content').removeClass('hidden');
					$('.filter-btn').addClass('hidden');
					$('#group_content').addClass('hidden');
					$('#filter_box').addClass('col-xs-push-9');
					$('#filter_box').removeClass('col-xs-push-6');


					break;
				case 1:
					$('#variants_content').removeClass('hidden');
					$('#overview_content').addClass('hidden');
					$('.filter-btn').removeClass('hidden');
					$('#group_content').addClass('hidden');
					break;
				case 2:
					$('#variants_content').removeClass('hidden');
					$('#overview_content').addClass('hidden');
					$('.filter-btn').removeClass('hidden');
					$('#group_content').removeClass('hidden');

					
			}
		});

		$('#addFileButton').click(function(e){
			if( $scope.restrict){
				alert('Audit users are not allowed to add files');
				e.stopPropagation();
				e.preventDefault();
			}

		});


		// Plot window resize according to parent window resize
		var aspect = 300 / 200,
			chart = $(".plot");
		$(window).on("resize", function() {
			var targetWidth = chart.width();
			chart.children().attr("width", targetWidth);
			chart.children().attr("height", targetWidth / aspect);
		});	

		

		$scope.showProject = function(index){
			$scope.index=index;
			$('#project_select_box').css('z-index',-1);
			$scope.showOverview();
			$scope.showMDSplot();

		};

		$scope.showAddUserModal = function(){
			if( $scope.restrict ){
				alert('Audit users are not allowed to add users.');
			} else{	
				$('#addUserModal').modal('toggle');
			}
		
		};

		$scope.addUser= function(){
			// Pop-up to add user 
			// 1. if already subscribed user :: add instantly 
			// 2. if a new user :: send confirmation mail 
			var email =  $('#inviteEmail').val();
			$('#addUserModal').modal('toggle');
			$('#inviteEmail').val('');

			$http({ 
				url:'/api/addUser',
				data:{
					email: email,
					title: $scope.userProject[$scope.index].title  , 
					projectId : $scope.userProject[$scope.index]._id
				},
				method:'post'
			})
			.error( function(data,err){
				alert('Fail to invite :: Server connection error. Try again!');
			})
			.success( function(data, err){
				switch (data) {
					case 'error':
						alert('Fail to invite :: Server connection error. Try again!');
						break;
					case 'current_user' :
						alert(email+' is already user for this project.');
						break;
				
					default:
						$scope.userProject[$scope.index].users.push( data );
				}
			
			});

		
		};

		$scope.showMDSplot  = function(){
			var data=[];
			var files = $scope.userProject[$scope.index].files;
			console.log( files );
			for( i=0; i < files.length ;i++){
				var file_data={};
				file_data.id=files[i].name;
				file_data.group=files[i].class;

				file_data.mdsX=files[i].mds2d[0]+1;
				file_data.mdsY=files[i].mds2d[1]+1;
	
				file_data.size=files[i].numVariants;
				data.push( file_data );	
			}	

			$('.multi_plot_MDS').empty();

			if( data.length > 0){
				VCF.drawBubbleChart('.multi_plot_MDS', data,{ headerTitle:'', R:'size' ,Y:'mdsY',X: 'mdsX',  xAxisLabel:'Coordinate 1', yAxisLabel:'Coordinate 2', margins:{top:20,left:50,right:20,bottom:35}, maxRadius:15, minRadius:7, tooltip: function(d){ return d.id+' : '+ d.group } } );
			}
		
		};

		$scope.showOverview = function(){
			
			$('.menu:eq(0)').click();

			// Show project overview plots  
			
			var files = $scope.userProject[$scope.index].files;
			var overview_data=[];


			var max_QS_length=0,
				max_DP_length=0;

			for( i=0; i < files.length ;i++){
				if( files[i].status != 'complete'	){
					continue;
				}
				var file_data={};
				file_data.id=files[i].name;
				file_data.group=files[i].class;
				file_data.qualityScore = files[i].QS_dist;
				file_data.depth = files[i].DP_dist;
				file_data.totalVariants  = files[i].numVariants;
				file_data.known_ratio = files[i].known_variants / files[i].numVariants;
				file_data.NS_AA_ratio = files[i].numNS_AA_change / files[i].numVariants;


				if( max_QS_length < file_data.qualityScore.length ){
					max_QS_length = file_data.qualityScore.length;
				}

				if( max_DP_length < file_data.qualityScore.length ){
					max_DP_length = file_data.depth.length;
				}


				overview_data.push( file_data );	
			}


			for( i in overview_data ){
				if( max_QS_length > overview_data[i].qualityScore.length){
					overview_data[i].qualityScore.length= max_QS_length;
					overview_data[i].qualityScore=_.map(overview_data[i].qualityScore , function(k){ if(k==undefined) return 0} );
				}
				if( max_DP_length > overview_data[i].depth.length){
					overview_data[i].depth.length= max_DP_length;
					overview_data[i].depth=_.map(overview_data[i].depth , function(k){ if(k==undefined) return 0} );
					
				}


			}


			// Initialize pane 
			$('.multi_plot_VC').empty();
			$('.multi_plot_DP').empty();
			$('.multi_plot_QS').empty();
					
			if( overview_data.length >0 ){
			VCF.drawMultiLineChart('.multi_plot_QS', overview_data, { headerTitle:'', Y:'qualityScore' , margins:{top:20,left:50,right:20,bottom:35}, xAxisLabel: 'QUALITY', yAxisLabel:'', tooltip: function(d){ return d.id }  }); 
			VCF.drawMultiLineChart('.multi_plot_DP', overview_data, { headerTitle:'', Y:'depth' , xAxisLabel: 'Read depth', yAxisLabel:'',margins:{top:20,left:50,right:20,bottom:35}, tooltip: function(d){ return d.id }  }); 
			VCF.drawBubbleChart('.multi_plot_VC', overview_data,{ headerTitle:'', R: 'totalVariants',Y:'known_ratio',X: 'NS_AA_ratio',  xAxisLabel:'#Non-synonymous variants ratio', yAxisLabel:'#Known variant ratio', margins:{top:20,left:50,right:20,bottom:35}, maxRadius:15, minRadius:7, tooltip: function(d){ return d.id +' : '+ d.group }} );
			}


		};


		$scope.setUserRole= function( user, role){
			if( $scope.restrict ){
				alert('Audit users are not allowed to change user role.');
				return;
			}
			user.role=role;
			// Update user role 
			$http({
				url:'/api/updateProjectContent',
				data:{
					projectId: $scope.userProject[$scope.index]._id,
					attr:'users',
					content: $scope.userProject[$scope.index].users 
				},
				method:'post'
			})
			.error( function(){
				alert('Fail to update user role :: Internet connection error.');
			})
			.success( function(data, status){

			});
				
				
		};

		$scope.setFileClass= function( filename, fileClass) {

			for( i in $scope.userProject[$scope.index].files){
				if( $scope.userProject[$scope.index].files[i].name == filename ){
					var preClass= $scope.userProject[$scope.index].files[i].class;

					if( preClass != fileClass ){
						$scope.userProject[$scope.index].files[i].class=fileClass; 
						$http({
							url:'/api/updateFileClass',
							data:{
								projectId: $scope.userProject[$scope.index]._id,
								//attr:'files',
								//content: $scope.userProject[$scope.index].files 
								file : filename,
								class: fileClass 
							},
							method:'post'
						})
						.error( function(){
							$scope.userProject[$scope.index].files[i].class= preClass; 
						})
						.success( function(data, status){
							VCF.removeData( fileClass);
							VCF.removeData( preClass  ); 

							if( $('.menu:eq(0)').hasClass('menu_selected') ){
								$scope.showOverview();
								$scope.showMDSplot();
							} else{

							}


						});
						break;
					}
				}
			}
		
		};


		$scope.addProject = function(){
					
			var newProject ={
						date:( new Date()).toISOString(),
						title:'Edit project title',
						files:[],
						class:['Case','Control'],
						summary:'',
						distance:[],
						users:[
							{
								email:sessionOn.getUsername(),
								role:'Admin'
							}	
						]
			};

			

			// Save new project to DB
			$http({
				url:'/api/saveNewProject',
				data: newProject,
				method:'post' 
			})
			.success( function( project, status ){
				$scope.userProject.push( project );
			})
			.error( function(){
			
			});

		};


		$scope.deleteProject = function(index){
			$http({
				url:'/api/deleteProject',
				data:{  
					projectId: $scope.userProject[index]._id,
					deletefiles : $scope.userProject[index].files	
				},
				method:'post'
			})
			.success( function( data, status ){
				$scope.userProject.splice(index,1 );
			});
		};



		$scope.deleteFile = function( filename ){
			if( $scope.restrict ){
				alert('Audit users are not allowed to delete files');
				return ;
			}

			$http({
				url:'/api/deleteFile',
				data:{
					projectId : $scope.userProject[$scope.index]._id,
					filename : filename,
					client_id: $scope.socket_id

				},
				method:'post'
			})
			.success( function( data, status ){
				for(var i=0; i< $scope.userProject[$scope.index].files.length; i++){
					if( $scope.userProject[$scope.index].files[i].name == filename ){
						$scope.userProject[$scope.index].files.splice( i, 1 );
						if( $('.menu_selected').find('p').text()=='Overview' ){
							$scope.showOverview();
						}
					}
				}
			});
		};

	
		$('[contenteditable]').on('focusout', function(){

			var content = $(this).text();
			var attr = $(this).attr('name');
			var projectId = $scope.userProject[$scope.index]._id ;

			$scope.userProject[$scope.index][attr]= content;

			$http({
				url:'/api/updateProjectContent',
				data:{
					projectId: projectId,
					attr : attr, 
					content : content 
				},
				method:'post'
			})
			.success( function(data, status ){
				$scope.userProject[$scope.index][attr]=title;	
			});

		});
	
	
		$scope.showFileView= function(selectedVCFfile, index){
			$('.file_name').removeClass('selected');
			$('.file_name').eq(index).addClass('selected');
			$('.menu:eq(1)').click();
			$('.plot_summary').empty();
			VCF.chartResetAll();

			if(VCF.hasData( selectedVCFfile )  ){
				// TODO 
				dc.filterAll(); // VCF.chartResetAll();
				VCF.summary('.plot_summary', selectedVCFfile);
				VCF.drawVariantTable( '.plot_table', selectedVCFfile);
				VCF.drawQualChart('.plot_QS', selectedVCFfile,{  height:130 });
				VCF.drawDPChart('.plot_DP', selectedVCFfile, { height:130});
				VCF.drawAminoAcidChangeChart('.plot_AAS', selectedVCFfile);
				VCF.drawNovelVariantChart('.plot_NV', selectedVCFfile, { verticalMode : true});
				VCF.drawRepetitionChart('.plot_RE', selectedVCFfile);
				VCF.drawRegionChart('.plot_GR', selectedVCFfile, {  verticalMode : true} );
				VCF.drawClinicalSignificanceChart('.plot_CS', selectedVCFfile);
				VCF.drawGTChart('.plot_GT', selectedVCFfile);




			}else{
				var VCFjsonFilename=selectedVCFfile.replace(/vcf$/,'json');

				$('.file-download').modal('show');

				$.ajax({
					xhr: function(){
						var xhr = new window.XMLHttpRequest();
						xhr.addEventListener("progress", function(evt) {
							if (evt.lengthComputable) {
								var percentComplete = evt.loaded / evt.total*100;
								$('.file-download .progress-bar').css('width',percentComplete +'%' );
							}
							
						}, false);
						return xhr;
					}, 
					/*
					type: 'get',
					url:'http://vcfjson.s3.amazonaws.com/'+  sessionOn.getUsername()  +'/'+VCFjsonFilename,
					*/
					headers: {
							'Authorization' : 'Bearer '+$window.sessionStorage.token
						},
					type:'post',
					url:'/api/getFile',
					data:{
						file:VCFjsonFilename
					},
					success: function( vcfjson ){
						vcfjson= JSON.parse( vcfjson);
						setTimeout( function(){
							$('.file-download .progress-bar').css('width','0%' );
							$('.file-download').modal('hide');
							VCF.addData( selectedVCFfile, vcfjson );
							//VCF.drawSingleView('.centerTab', selectedVCFfile); 
							VCF.summary('.plot_summary', selectedVCFfile);
							VCF.drawVariantTable( '.plot_table', selectedVCFfile);
							VCF.drawQualChart('.plot_QS', selectedVCFfile,{ height:130 });
							VCF.drawDPChart('.plot_DP', selectedVCFfile, { height:130});
							VCF.drawAminoAcidChangeChart('.plot_AAS', selectedVCFfile);
							VCF.drawNovelVariantChart('.plot_NV', selectedVCFfile, {verticalMode:true, height:80, headerText:'' });
							VCF.drawRepetitionChart('.plot_RE', selectedVCFfile, {verticalMode:true, headerText:''} );
							VCF.drawRegionChart('.plot_GR', selectedVCFfile, { verticalMode:true, headerText:''});
							VCF.drawClinicalSignificanceChart('.plot_CS', selectedVCFfile, {verticalMode:true, headerText:''} );
							VCF.drawGTChart('.plot_GT', selectedVCFfile, {verticalMode:true, headerText:''} );

						
						},1000);
						
					}
				});
			}
		};



		$scope.addClass = function(className, e){
			e.stopPropagation();

			if( className ){
				var hasClass=_.filter( $scope.userProject[$scope.index].class, function(name){ return name == className});
				if( hasClass.length == 0){
					$scope.userProject[$scope.index].class.push( className );

					$http({
						url:'/api/updateProjectContent',
						data:{
							projectId : $scope.userProject[$scope.index]._id,
							attr:'class',
							content: $scope.userProject[$scope.index].class
						} , 
						method:'post' 
					})
				}
			}
		};



		// TODO : Group calculator 

		$scope.selectCalcClass= function( selectedclass,e){
			$(e.target).parent().parent().siblings('button').find('.selectedClass').text( selectedclass );
		
		};

		$scope.selectCalcOperator= function( selectedOperator,e){
			$(e.target).parent().parent().siblings('button').find('.selectedOperator').text( selectedOperator );
		
		};

		$scope.addCalc = function(e){
			$(e.target).before( $compile("<add-operator-html></add-operator-html><add-class-html type='control'></add-class-html> ")($scope) );
		};



		$scope.doCalc = function(){
			// Empty variant table
			$('.plot_summary').empty();
			$('.plot_table').empty();


			var classes4Download=[], operators=[], classes4Calc=[];

			$('#calceditor .selectedClass').each( function(i,dom){
				var selectedClass = $(dom).text().trim() ;
				if( ! VCF.hasData( selectedClass ) ){
					classes4Download.push( selectedClass );
				}
				classes4Calc.push( selectedClass );
				
			});

			$('#calceditor .selectedOperator').each( function(i,dom){
				operators.push( $(dom).text().trim() );
			});

			if( classes4Download.length > 0){
			 $('.calc-progress').modal('show');

				$.ajax({
					xhr: function(){
						var xhr = new window.XMLHttpRequest();
						xhr.addEventListener("progress", function(evt) {
							if (evt.lengthComputable) {
								var percentComplete = evt.loaded / evt.total*100;
								$('.calc-progress .progress-bar').css('width',percentComplete +'%' );
							}
							
						}, false);
						return xhr;
					}, 
					type: 'post',
					url:'/api/getClassFiles', 
					headers: {
							'Authorization' : 'Bearer '+$window.sessionStorage.token
						},

					data:{
						projectId: $scope.userProject[$scope.index]._id,
						classes: classes4Download
					},
					success: function(data){
						VCF.removeAllData();
						console.log('# class file ', data );
						setTimeout( function(){
			 			$('.calc-progress').modal('hide');
						$('.calc-progress .progress-bar').css('width','0%');
							for(i in data){
								VCF.addData( i , JSON.parse(data[i]) ); 
							}
							showResult();
						}, 1000);
					}

				});
			} else{
				showResult();
			}

			function  showResult(  ){
				var calculator=[];
				// Display first  Merged VCF
				//VCF.drawSingleView('#singlePane', classes4Calc[0] ); 
					
				// VCF group operation 
				calculator.push( classes4Calc.shift() );
				for(i in operators){
					calculator.push( classes4Calc.shift() );

					console.log( calculator, operators[i] );
					switch( operators[i] ){
						case '∩' : 
							VCF.addData('result',VCF.intersection( calculator[0], calculator[1] ));
							break;
						case 'U' :
							VCF.addData('result',VCF.union( calculator[0], calculator[1] ));

							break;
						case '-':
							VCF.addData('result',VCF.difference( calculator[0], calculator[1] ));
					}
				
					calculator.splice(0,2);
					calculator.push('result');
					

				}

				// Display operation result 
				//VCF.drawSingleView('#groupPane', 'result');


				VCF.chartResetAll();
				VCF.summary('.plot_summary', 'result');
				VCF.drawVariantTable( '.plot_table', 'result');
				VCF.drawQualChart('.plot_QS', 'result',{  height:130 });
				VCF.drawDPChart('.plot_DP', 'result', { height:130});
				VCF.drawAminoAcidChangeChart('.plot_AAS', 'result');
				VCF.drawNovelVariantChart('.plot_NV', 'result', {headerText:'', verticalMode : true});
				VCF.drawRepetitionChart('.plot_RE', 'result', { headerText:'',verticalMode : true});
				VCF.drawRegionChart('.plot_GR', 'result', { verticalMode : true, headerText:''});
				VCF.drawClinicalSignificanceChart('.plot_CS', 'result', { verticalMode : true,headerText:''});
				VCF.drawGTChart('.plot_GT', 'result', { verticalMode : true,headerText:''});

	

			};
		

		};


		// Anguular-file-uploader 
		uploader=$scope.uploader = new FileUploader({
			url:'/api/upload',
			headers:{
				'Authorization' : 'Bearer '+$window.sessionStorage.token
			}
		});

		uploader.onAfterAddingFile = function(item) {
			var isUploaded=_.find( $scope.userProject[$scope.index].files, function(file){ return file.name==item.file.name  });
			if( isUploaded  ) {
				alert( item.file.name +' was already uploaded');
				uploader.removeFromQueue( item );
			}
			else{
				item.formData.push( { 
					projectId: $scope.userProject[$scope.index]._id,
					client_id: $scope.socket_id,
					class : 'Case'
				} );
				uploader.uploadItem( item);
			}
		};

		uploader.onBeforeUploadItem = function( item){
		};

		uploader.onCompleteItem= function(item,res){
			var file ={};
			file.name= item.file.name;
			file.class='Case';
			file.status='processing';
			uploader.removeFromQueue(item);
			$scope.userProject[$scope.index].files.push(file);

		};

		// socket event 
		var socket = io.connect('http://54.65.43.210:7777');
		socket.on('connected', function(id ){
			$scope.socket_id=id;
			console.log('####CONNECT ::'+ id );
		});

		socket.on('ANNOVAR_processing_done', function (data) {
			// Update file status 
			for( i in $scope.userProject ){
				if( $scope.userProject[i]._id == data.projectId ){
					for( k in $scope.userProject[i].files ){
						if( $scope.userProject[i].files[k].name == data.file.name ){

							//$scope.userProject[i].files[k].status ='complete';
							for( m in data.file ){
								$scope.userProject[i].files[k][m] = data.file[m];
							}
							//$scope.userProject[i].files[k] = data.file;
							$scope.showOverview();
							break;
						}
					}
				}
			}

		});


		socket.on('MDS_processing_done', function( data){
			console.log('##### MDS processing');
			var projectId = data.projectId;
			var files = data.files; 
			for( i in $scope.userProject ){
				if( $scope.userProject[i]._id == data.projectId ){
					for(  k in  $scope.userProject[i].files ){
						 $scope.userProject[i].files[k].mds2d = files[k].mds2d;
						 $scope.userProject[i].files[k].numVariants = files[k].numVariants;
						 
					}
					//console.log('MDS update', $scope.userProject[i].files, files );

					// TODO :: Update MDS plot 
					$scope.showMDSplot();
					// TODO :: Overview 에서 독립적으로 MDS plot   
					// TODO :: deleteFile 시 file 1개 남는 상황에서 MDS plot update 

					break;
				}
			}
		});
/*
		uploader.onCompleteAll= function(){
			var uploadedFiles=$scope.userProject[$scope.index].files;
			for( i in uploader.queue){
				var fileItem={};
				var item = uploader.queue[i];
				fileItem['name']= item.file.name;
				fileItem['class']='Case';
				uploadedFiles.push( fileItem  );

			}
			uploader.clearQueue();
			$scope.userProject[$scope.index].files= uploadedFiles;
		};

*/
		

	})
	.controller('dashboardCtrl', function( $scope, $http, $routeParams, $window, sessionOn , $fileUploader, selectedProject){
		if( !sessionOn.validToken ){
			$window.location.href='/';
		}

		$http({url: '/api/getUserProjects', method: 'GET'})
		.success(function (data, status, headers, config) {
			$scope.userProject= data;

		})
		.error( function(){
			sessionOn.validToken =false;
			$window.location.href='/';
		});

		$scope.viewProject= function( id ){
			$window.location.href='#project/'+id; 
		};
		
		$scope.startVCFexplore = function( id, title, files ){
			selectedProject.projectId = id;
			selectedProject.title = title;
			selectedProject.files = files;
			$window.location.href='#vcfexplore/';

		};

		$scope.deleteProject = function( id, files ){
			$http({
				url:'/api/deleteProject',
				method:'post',
				data:{ projectId: id , deletefiles: files }

			})
			.success( function(data, status ){
				if( data=='ok'){
					// project list update 
					for( var i=0; i < $scope.userProject.length; i++){
						if( $scope.userProject[i]._id == id ){
							$scope.userProject.splice(i,1);
						}
					}
				}	
			});
		};

		// Form initialization
		$('#projecteditModal').on('show.bs.modal', function(e){
			$('.form-control').val('');	
			// File uploader initialize
			$scope.doneUpload=false;
			uploader.clearQueue();

		});
	
		/* Project create */
		var regexVCFformat=/^#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\tFORMAT\t/m;
		var isVCFfile={};

		$scope.checkValidVCF = function( $filesContent ) {
			isVCFfile[ $filesContent.name]=  regexVCFformat.test( $filesContent.content ) ;
		};

		$scope.isVCF = function( file ){
			return isVCFfile[file];
		};

		$scope.createProject = function(){
			if( uploader.queue.length ){
				uploader.uploadAll();
				$('.btn-loading').button('loading');
			} else{
				$('#noVCFAlert').modal();
			}
		}

		// File upload  using angularfileupload library

		var uploader = $scope.uploader = $fileUploader.create({
            scope: $scope,
			url:'/api/upload',
			headers:{
				'Authorization' : 'Bearer '+$window.sessionStorage.token
			}
    });

		
		uploader.bind('error', function (event, xhr, item, response) {
    });

		uploader.bind('beforeupload', function( event, item, xhr){
			item.formData.push( { 
				title: $scope.project_title ,
				summary: $scope.project_summary	
			} );
		});

	    uploader.bind('afteraddingfile', function (event, item) {
            //console.info('After adding a file', item.file.name +' '+ item.file.size);
        });

		uploader.bind('completeall', function( event, items){
			$scope.doneUpload=true;	
			$('.btn-loading').button('reset');

			var title = items[0].formData[0].title;
			var summary = items[0].formData[0].summary;

			var uploadedFiles=[];
			for( var i=0; i<items.length; i++){
				uploadedFiles.push( items[i].file.name );

			}
			

			$http( {
				url:'/api/saveNewProject', 
				data:{ title: title, summary:summary, files: uploadedFiles  }, 
				method:'POST' 
			})
			.success( function( data, status, headers, config){
				// Update Project list 
				$scope.userProject.push( data );

			});


		});	
	

	})
	.controller('loginCtrl', function( $scope, $http, $window, sessionOn){
		$scope.login= function(user){
			var loginReq = $http({
				url:'/login',
				data: { 'id':user.id ,  'pw':user.pw },
				method:'POST'
	
			});
			loginReq
				.success( function(data, status, headers, config){
					 $window.sessionStorage.token = data.token ;
					 var encodedProfile = data.token.split('.')[1];
					 var profile = JSON.parse(url_base64_decode(encodedProfile));
					 $window.sessionStorage.id = profile.id; 
					 sessionOn.validToken=true;
					 $window.location.href='#dashboard_temp';	
				})
				.error( function( data, status, headers, config){
					delete $window.sessionStorage.token;
				});
		};
	})
	.controller('signupCtrl', function($scope, $http, $window){

		$scope.register= function(){
			if( $scope.signupForm.$valid && $scope.pw == $scope.pwConfirm ){

				var signupReq=$http({
					url:'/register_user',
					data: { 'id':$scope.email ,  'pw':$scope.pw },
					method:'POST'
				} );
				signupReq.success( function(data, status, headers, config){
					if( data =='ok'){
						// Show modal
						// 1. MSG of signup success
						// 2. Direct to dashboard page
						$('#signupSuccessModal').modal();	

					}else{
						$('#signupErrorModal').modal({
							keyboard:true
						}); 
					}	
				});
			} else{
				alert('Signup Error: password should be at least 6 characters');	
			}
				
		};

		$('#signupSuccessModal').on('hidden.bs.modal', function(e){
			$window.location.href='#login';
		});

	})
	.controller('ctr', function( $scope, $http){
		$scope.data={}; 
		$scope.getFile = function(){
			var req = $http({
				method:'get',
				url:'http://vcfjson.s3.amazonaws.com/AC2_Exome_final.json'
			});

			req.success ( function(data,status, headers, config){
				$scope.data=data;
			});
		};


	});


// Directive 

app.directive('showUserSymbol',function(){
	return function( scope, elem, attr, controller){
		elem.css({ 'display': attr.show} );
	};

}); 

app.directive('addOperatorHtml', function(){
	return {
		templateUrl:'template/OperatorSelectHTML.html'  ,
		restrict:'AE' ,
		link : function link( scope, iE, iA, ctrl){
			iE.find('.selectedOperator').text( iA.type );	
		}
	};

});

app.directive('addClassHtml', function(){
	return {
		templateUrl:"template/ClassSelectHTML.html", 
		restrict:'AE',
		link : function link( scope, iE, iA, ctrl){
			iE.find('.selectedClass').text( iA.type );	
		
		}
	}

});

app.directive('drawLine', function(){
	return {
		template:"<div class='table-bar'></div>",
		restrict:'AE',
		link : function link( scope, iE, iA, ctrl){
			iE.find('div').css('width', iA.length +'%' );
		}
	}

});


app.directive('areaPlot', function(){
	return {
		template:"",
		restrict:'AE',
		link : function link( scope, iE, iA, ctrl ){
			var data = [];
			var d=JSON.parse( iA.data ) ;
			var id = iA.name.replace(/\./,'_');
			for( i in  d ){
				data.push({
					key: i ,
					value : d[i] 
				});
			
			}
			iE.append('<div id='+ id + ' class=areaPlot></div>');
			areaPlot('#'+ id, data, 200, 100 );	
		}
	}
});


app.directive('onReadFile', function($parse){
	return{
		restrict:'A',
		scope: false, 
		link: function(scope, elem, attrs ){
			var fn = $parse(attrs.onReadFile );
			elem.on('change', function(onChangeEvent){
				var files = onChangeEvent.target.files;
				var readFiles=[];
				for( var i=0,f; f=files[i]; i++) {
					var reader = new FileReader();

					reader.onload = ( function(file ){
					
						return function(e){
							readFiles.push( e.target.result );
							
							scope.$apply( function(){
								fn(scope, {$filesContent: { 
												name: file.name,
												content: readFiles 
										  } 
								});
							});

						};
					})(f); 

					reader.readAsText( f );
				}
			});
		}
	};

});

app.directive("contenteditable", function($http) {
  return {
    restrict: "A",
    require: "ngModel",
    link: function(scope, element, attrs, ngModel) {

      function read() {
        ngModel.$setViewValue(element.html());
      }

      ngModel.$render = function() {
        element.html(ngModel.$viewValue || "");
      };

      element.bind("blur keyup change", function() {
		// Update project title 
		$http({
			url:'/api/updateProjectContent',
			data:{
				projectId : attrs.projectId  , 
				attr:attrs.attr,
				content: element.html()
			} , 
			method:'post' 
		})

        scope.$apply(read);
      });
    }
  };
});

// Global functions
function url_base64_decode(str) {
  var output = str.replace('-', '+').replace('_', '/');
  switch (output.length % 4) {
    case 0:
      break;
    case 2:
      output += '==';
      break;
    case 3:
      output += '=';
      break;
    default:
      throw 'Illegal base64url string!';
  }
  return window.atob(output); //polifyll https://github.com/davidchambers/Base64.js
}


