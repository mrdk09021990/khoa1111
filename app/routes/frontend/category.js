var express = require('express');
var router = express.Router();

const ParamsHelpers = require(__path_helpers + 'params');
const ArticleModel 	= require(__path_models + 'article');

const folderView	 = __path_views_blog + 'pages/category/';
const layoutBlog    = __path_views_blog + 'frontend';

/* GET home page. */
router.get('/:id', async (req, res, next) => {
	let idCategory 		= ParamsHelpers.getParam(req.params, 'id', '');

	let itemsInCategory	= [];

	// Article In Category
	await ArticleModel.listItemsFrontend({id: idCategory}, {task: 'items-in-category'} ).then( (items) => { itemsInCategory = items; });

	res.render(`${folderView}index`, {
		layout: layoutBlog,
		top_post: false,
		itemsInCategory
	});
});

module.exports = router;
