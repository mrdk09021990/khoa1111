const ArticleModel 	= require(__path_schemas + 'article');
const FileHelpers = require(__path_helpers + 'file');
const uploadFolder = 'public/uploads/article/';
module.exports = {
    listItems: (params, options = null) => {
        let objWhere    = {};
        let sort		= {};
        if(params.currentStatus !== 'all') objWhere.status = params.currentStatus;
        if(params.keyword !== '') objWhere.name = new RegExp(params.keyword, 'i');
        
        sort[params.sortField]  = params.sortType;
        
        if(params.categoryID !== 'allvalue' && params.categoryID !== '') objWhere['category.id'] = params.categoryID; 
	    if(params.currentStatus !== 'all') objWhere.status = params.currentStatus;
        if(params.keyword !== '') objWhere.name = new RegExp(params.keyword, 'i');

        return ArticleModel
            .find(objWhere)
            .select('name thumb status special ordering created modified category.name') 
            .sort(sort)
            .skip((params.pagination.currentPage-1) * params.pagination.totalItemsPerPage)
            .limit(params.pagination.totalItemsPerPage);
    },

    listItemsFrontend: (params = null, options = null) => {
        let find = {};
        let select = 'name created.user_name created.time category.id category.name thumb';
        let limit = 3;
        let sort = '';

        if (options.task == 'items-special'){
            find = {status:'active', special: 'active'};
            sort = {ordering: 'asc'};            
        }

        if (options.task == 'items-news'){
            select = 'name created.user_name created.time category.name category.id  thumb content';
            find = {status:'active'};
            sort = {'created.time': 'desc'};   
        }

        if (options.task == 'items-in-category'){
            select = 'name created.user_name created.time category.name thumb content';
            find = {status:'active', 'category.id': params.id};
            sort = {'created.time': 'desc'};   
        }


        if (options.task == 'items-random'){
            return ArticleModel.aggregate([
                    { $match: { status: 'active' }},
                    { $project : {name : 1 , created : 1 ,thumb: 1}  },
                    { $sample: {size: 3}}
                ]); 
        }
        if (options.task == 'items-others'){
            select = 'name created.user_name created.time category.id category.name thumb content';
            find = {status:'active', '_id': {$ne: params._id}, 'category.id': params.category.id};
            sort = {'created.time': 'desc'};   
        }

        return ArticleModel.find(find).select(select).limit(limit).sort(sort);
       
    },

    getItem: (id, options = null) => {
        return ArticleModel.findById(id);
    },

    getItemFrontend: (id, options = null) => {
        return ArticleModel.findById(id)
            .select('name thumb created content category.name category.id');
    },

    countItem: (params, options = null) => {
        let objWhere    = {};
        if(params.categoryID !== 'allvalue' && params.categoryID !== '') objWhere['category.id'] = params.categoryID; 
	    if(params.currentStatus !== 'all') objWhere.status = params.currentStatus;
        if(params.keyword !== '') objWhere.name = new RegExp(params.keyword, 'i');

        return ArticleModel.countDocuments(objWhere);
    },

    changeStatus: (id, currentStatus, options = null) => {
        let status			= (currentStatus === "active") ? "inactive" : "active";
        let data 			= {
            status: status,
            modified: {
                user_id: 0,
                user_name: 0,
                time: Date.now()
            }
        }

        if(options.task == "update-one"){
            return ArticleModel.updateOne({_id: id}, data);
        }

        if(options.task == "update-multi"){
            data.status = currentStatus;
            return ArticleModel.updateMany({_id: {$in: id }}, data);
        }
    },

    changeSpecial: (id, currentSpecial, options = null) => {
        let special			= (currentSpecial === "active") ? "inactive" : "active";
        let data 			= {
            special: special,
            modified: {
                user_id: 0,
                user_name: 0,
                time: Date.now()
            }
        }

        if(options.task == "update-one"){
            return ArticleModel.updateOne({_id: id}, data);
        }

        if(options.task == "update-multi"){
            data.special = currentSpecial;
            return ArticleModel.updateMany({_id: {$in: id }}, data);
        }
    },

    changeOrdering: async (cids, orderings, options = null) => {
        let data = {
            ordering: parseInt(orderings), 
            modified:{
                user_id: 0,
                user_name: 0,
                time: Date.now()
                }
            };

        if(Array.isArray(cids)) {
            for(let index = 0; index < cids.length; index++) {
                data.ordering = parseInt(orderings[index]);
                await ArticleModel.updateOne({_id: cids[index]}, data)
            }
            return Promise.resolve("Success");
        }else{
            return ArticleModel.updateOne({_id: cids}, data);
        }
    },

    deleteItem: async (id, options = null) => {
        if(options.task == "delete-one") {
            await ArticleModel.findById(id).then((item) => {
                FileHelpers.remove(uploadFolder, item.thumb);
            });
            return ArticleModel.deleteOne({_id: id});
        }

        if(options.task == "delete-mutli") {
            if(Array.isArray(id)){
                for(let index = 0; index < id.length; index++){
                    await ArticleModel.findById(id[index]).then((item) => {
                        FileHelpers.remove(uploadFolder, item.thumb);
                    }); 
                }
            }else{
                await ArticleModel.findById(id).then((item) => {
                    FileHelpers.remove(uploadFolder, item.thumb);
                });
            }
            return ArticleModel.deleteMany({_id: {$in: id } });
        }
    },

    saveItem: (item, options = null) => {
        if(options.task == "add") {
            item.created = {
				user_id : 0,
				user_name: "admin",
				time: Date.now()
			}
			item.category = {
				id: item.category_id,
				name: item.category_name,
			}
			return new ArticleModel(item).save();
        }

        if(options.task == "edit") {
            return ArticleModel.updateOne({_id: item.id}, {
				ordering: parseInt(item.ordering),
				name: item.name,
                status: item.status,
                special: item.special,
                content: item.content,
                thumb: item.thumb,
				category: {
					id: item.category_id,
					name: item.category_name,
				},
				modified: {
					user_id : 0,
        			user_name: 0,
        			time: Date.now()
				}
			});
        }

        if(options.task == "change-category-name") {
            return ArticleModel.updateMany({'category.id': item.id}, {
				category: {
                    id: item.id,
					name: item.name,
				},
			});
        }
    }
}