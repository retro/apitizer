define([
'lodash/objects/assign',
'lodash/objects/merge',
'lodash/objects/isArray',
'lodash/collections/contains',
'lodash/collections/reduce'
], function(_assign, _merge, _isArray, _contains, _reduce){

	var API = function(store){
		this.store = store;
	};

	_assign(API.prototype, {
		findOne : function(params){

			params = this._prepareParams(params);

			var items = this._getRecordset(params);
			if(items.count()){
				return items.first();
			} else {
				throw this._formatException({errors: ["MissingRecord"], status: 404});
			}
		},
		findAll : function(params){

			params = this._prepareParams(params);

			var results = {},
				limit = params.limit,
				offset = params.offset,
				items;

			delete params.limit;
			delete params.offset;

			items = this._getRecordset(params);
			
			results.count = items.count();

			if(limit){
				results.limit = limit;
				items = items.limit(parseInt(limit, 10));
			}

			if(offset){
				results.offset = offset;
				items = items.start(offset);
			}

			results.data = items.get();

			return results;
		},
		create : function(params, data){
			var item = _merge(this.store.generate(), data),
				validation = this.store.validate(item);

			if(validation.valid){
				this.store.db.insert(item);
			} else {
				throw this._formatException({errors: validation.errors, status: 406});
			}
			return item;
		},
		update : function(params, data){

			params = this._prepareParams(params);

			var items = this._getRecordset(params),
				item, validation;

			if(items.count() === 0){
				throw this._formatException({errors: ["MissingRecord"], status: 404});
			}

			item = _merge(items.first(), data);
			validation = this.store.validate(item);

			if(validation.valid){
				items.update(item);
				return item;
			} else {
				throw this._formatException({errors: validation.errors, status: 406});
			}

		},
		destroy : function(params){

			params = this._prepareParams(params);

			var items = this._getRecordset(params);
			if(items.count()){
				items.remove();
				return {};
			} else {
				throw this._formatException({errors: ["MissingRecord"], status: 404});
			}
		},
		_getRecordset : function(params){
			var order = params.order,
				items;

			delete params.order;

			items = this.store.db(params);

			if(order){
				items = items.order(this._prepareOrder(order));
			}

			return items;
		},
		_prepareOrder : function(order){
			if(_isArray(order)){
				return order.join(', ');
			}
			return order;
		},
		_prepareParams : function(params){
			var protectedParams = ['order', 'limit', 'offset'];

			return _reduce(params || {}, function(acc, val, key){
				if(_contains(protectedParams, key)){
					acc[key] = val;
				} else {
					acc[key] = {'==' : val};
				}
				return acc;
			}, {});
		},
		_formatException : function(ex){
			return ex;
		}
	});

	API.extend = function(obj){
		return function(store){
			var api = new API(store);
			_assign(api, obj);
			return api;
		}
	}

	return API;
});