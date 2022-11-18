var express = require('express');
var router 	= express.Router();
const util = require('util');

const systemConfig  = require(__path_configs + 'system');
const notify  		= require(__path_configs + 'notify');
const ArticleModel 	= require(__path_models + 'article');
const CategoryModel 	= require(__path_models + 'category');
const ValidateArticle	= require(__path_validates + 'article');
const UtilsHelpers 	= require(__path_helpers + 'utils');
const FileHelpers = require(__path_helpers + 'file');
const ParamsHelpers = require(__path_helpers + 'params');

const linkIndex		 = '/' + systemConfig.prefixAdmin + '/article/';
const pageTitleIndex = 'Article Management';
const pageTitleAdd   = pageTitleIndex + ' - Add';
const pageTitleEdit  = pageTitleIndex + ' - Edit';
const folderView	 = __path_views_admin + 'pages/article/';
const uploadThumb	 = FileHelpers.upload('thumb', 'article');

// List article
router.get('(/status/:status)?', async (req, res, next) => {
	let params 		 = {};
	params.keyword		 = ParamsHelpers.getParam(req.query, 'keyword', '');
	params.currentStatus = ParamsHelpers.getParam(req.params, 'status', 'all'); 
	params.sortField  	 = ParamsHelpers.getParam(req.session, 'sort_field', 'name');
	params.sortType 	 = ParamsHelpers.getParam(req.session, 'sort_type', 'asc');
	params.categoryID 		 = ParamsHelpers.getParam(req.session, 'category_id', '');
	params.pagination 	 = {
		totalItems		 : 1,
		totalItemsPerPage: 5,
		currentPage		 : parseInt(ParamsHelpers.getParam(req.query, 'page', 1)),
		pageRanges		 : 3
	};
		
	let statusFilter = await UtilsHelpers.createFilterStatus(params.currentStatus, 'users');

	let caterogyItems	= [];
	await CategoryModel.listItemsInSelectbox().then((items)=> {
		caterogyItems = items;
		caterogyItems.unshift({_id: 'allvalue', name: 'All Category'});
	
		
	});

	await ArticleModel.countItem(params).then( (data) => {
		params.pagination.totalItems = data;
	});
	
	ArticleModel.listItems(params)	
		.then( (items) => {
			res.render(`${folderView}list`, { 
				pageTitle: pageTitleIndex,
				items,
				statusFilter,
				caterogyItems,
				params
			});
		});
});

// Change special
router.get('/change-special/:id/:special', (req, res, next) => {
	let currentSpecial	= ParamsHelpers.getParam(req.params, 'special', 'active'); 
	let id				= ParamsHelpers.getParam(req.params, 'id', ''); 

	ArticleModel.changeSpecial(id, currentSpecial, {task: "update-one"}).then((result)=> {
		req.flash('success', notify.CHANGE_SPECIAL_SUCCESS, false);
		res.redirect(linkIndex);
	})
});

// Change status
router.get('/change-status/:id/:status', (req, res, next) => {
	let currentStatus	= ParamsHelpers.getParam(req.params, 'status', 'active'); 
	let id				= ParamsHelpers.getParam(req.params, 'id', ''); 

	ArticleModel.changeStatus(id, currentStatus, {task: "update-one"}).then((result)=> {
		req.flash('success', notify.CHANGE_STATUS_SUCCESS, false);
		res.redirect(linkIndex);
	})
});

// Change status - Multi
router.post('/change-status/:status', (req, res, next) => {
	let currentStatus	= ParamsHelpers.getParam(req.params, 'status', 'active'); 

	ArticleModel.changeStatus(req.body.cid, currentStatus, {task: "update-multi"}).then((result) => {
		req.flash('success', util.format(notify.CHANGE_STATUS_MULTI_SUCCESS, result.n) , false);
		res.redirect(linkIndex);
	});
});

// Change ordering - Multi
router.post('/change-ordering', (req, res, next) => {
	let cids 		= req.body.cid;
	let orderings 	= req.body.ordering;
	
	ArticleModel.changeOrdering(cids, orderings, null).then((result)=>{
		req.flash('success', notify.CHANGE_ORDERING_SUCCESS, false);
		res.redirect(linkIndex);
	});
});

// Delete
router.get('/delete/:id', async (req, res, next) => {
	let id				= ParamsHelpers.getParam(req.params, 'id', ''); 
	ArticleModel.deleteItem(id, {task: 'delete-one'} ).then((result) => {
		req.flash('success', notify.DELETE_SUCCESS, false);
		res.redirect(linkIndex);
	});
});

// Delete - Multi
router.post('/delete', (req, res, next) => {
	ArticleModel.deleteItem(req.body.cid, {task: 'delete-mutli'} ).then((result) => {
		req.flash('success', util.format(notify.DELETE_MULTI_SUCCESS, result.n), false);
		res.redirect(linkIndex);
	});
});

// FORM
router.get(('/form(/:id)?'), async (req, res, next) => {
	let id		= ParamsHelpers.getParam(req.params, 'id', '');
	let item	= {name: '', ordering: 0, status: 'novalue', category_id: '', category_name: ''};
	let errors   = null;
	let categoryItems	= [];
	await CategoryModel.listItemsInSelectbox().then((items)=> {
		categoryItems = items;
		categoryItems.unshift({_id: 'allvalue', name: 'All Category'});
	});
	
	if(id === '') { // ADD
		res.render(`${folderView}form`, { pageTitle: pageTitleAdd, item, errors, categoryItems});
	}else { // EDIT
		ArticleModel.getItem(id).then( (item) =>{
			item.category_id = item.category.id;
			item.category_name = item.category.name;
			res.render(`${folderView}form`, { pageTitle: pageTitleEdit, item, errors, categoryItems});
		});	
	}
});

// SAVE = ADD EDIT
router.post('/save',  (req, res, next) => {
	uploadThumb(req, res, async (errUpload) => {
		req.body = JSON.parse(JSON.stringify(req.body));

		let item = Object.assign(req.body);
		let taskCurrent	= (typeof item !== "undefined" && item.id !== "" ) ? "edit" : "add";

		let errors = ValidateArticle.validator(req, errUpload, taskCurrent);
		
		if(errors.length > 0) { 
			let pageTitle = (taskCurrent == "add") ? pageTitleAdd : pageTitleEdit;
			if(req.file != undefined) FileHelpers.remove('public/uploads/article/', req.file.filename); // xóa tấm hình khi form không hợp lệ
		
			let categoryItems	= [];
			await CategoryModel.listItemsInSelectbox().then((items)=> {
				categoryItems = items;
				categoryItems.unshift({_id: 'allvalue', name: 'All Category'});
			});
			
			if (taskCurrent == "edit") item.thumb = item.image_old;
			res.render(`${folderView}form`, { pageTitle, item, errors, categoryItems});
		}else {
			let message = (taskCurrent == "add") ? notify.EDIT_SUCCESS : notify.EDIT_SUCCESS;
			if(req.file == undefined){ // không có upload lại hình
				item.thumb = item.image_old;
			}else{
				item.thumb = req.file.filename;
				if(taskCurrent == "edit") FileHelpers.remove('public/uploads/article/', item.image_old);
			}

			ArticleModel.saveItem(item, {task: taskCurrent}).then((result) => {
				req.flash('success', message, false);
				res.redirect(linkIndex);
			});
		}
	});
});

// SORT
router.get(('/sort/:sort_field/:sort_type'), (req, res, next) => {
	req.session.sort_field		= ParamsHelpers.getParam(req.params, 'sort_field', 'ordering');
	req.session.sort_type		= ParamsHelpers.getParam(req.params, 'sort_type', 'asc');
	res.redirect(linkIndex);
});

// FILTER CATEGORY
router.get(('/filter-category/:category_id'), (req, res, next) => {
	req.session.category_id		= ParamsHelpers.getParam(req.params, 'category_id', '');
	res.redirect(linkIndex);
});


module.exports = router;
