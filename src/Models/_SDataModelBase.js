import declare from 'dojo/_base/declare';
import SDataStore from '../Store/SData';
import Deferred from 'dojo/Deferred';
import all from 'dojo/promise/all';
import when from 'dojo/when';
import utility from '../Utility';
import _ModelBase from './_ModelBase';
import Manager from './Manager';
import MODEL_TYPES from './Types';

const __class = declare('argos.Models.SDataModelBase', [_ModelBase], {
  queryModels: null,
  ModelType: MODEL_TYPES.SDATA,

  _getQueryModelByName: function _getQueryModelByName(name) {
    if (!this.queryModels) {
      console.warn('No query Models defined');// eslint-disable-line
    }

    const results = this.queryModels.filter((model) => model.name === name);
    return results[0];
  },
  init: function init() {
    this.inherited(arguments);
    this.queryModels = this.queryModels || this._createCustomizedLayout(this.createQueryModels(), 'queryModel');
  },
  createQueryModels: function createQueryModels() {
    return [];
  },
  getOptions: function getOptions(options) {
    const tempOptions = {};
    if (options) {
      if (options.select) tempOptions.select = options.select;
      if (options.include) tempOptions.include = options.include;
      if (options.orderBy) tempOptions.orderBy = options.orderBy;
      if (options.contractName) tempOptions.contractName = options.contractName;
      if (options.resourceKind) tempOptions.resourceKind = options.resourceKind;
      if (options.resourceProperty) tempOptions.resourceProperty = options.resourceProperty;
      if (options.resourcePredicate) tempOptions.resourcePredicate = options.resourcePredicate;
      if (options.queryArgs) tempOptions.queryArgs = options.queryArgs;
      if (options.start) tempOptions.start = options.start;
      if (options.count) tempOptions.count = options.count;
    }

    return tempOptions;
  },
  getId: function getId(options) {
    return options && (options.id || options.key);
  },
  buildQueryExpression: function _buildQueryExpression(query, options) {
    const passed = options && (options.query || options.where);
    return passed ? query ? '(' + utility.expand(this, passed) + ') and (' + query + ')' : '(' + utility.expand(this, passed) + ')' : query;// eslint-disable-line
  },
  createStore: function createStore(type, service) {
    const app = this.get('app');
    const config = this;
    const typedConfig = this._getQueryModelByName(type);

    return new SDataStore({
      service: service || app.getService(false),
      contractName: config.contractName,
      resourceKind: config.resourceKind,

      resourceProperty: typedConfig.resourceProperty,
      resourcePredicate: typedConfig.resourcePredicate,
      include: typedConfig.queryInclude,
      select: typedConfig.querySelect,
      where: typedConfig.queryWhere,
      queryArgs: typedConfig.queryArgs,
      orderBy: typedConfig.queryOrderBy,

      itemsProperty: config.itemsProperty,
      idProperty: config.idProperty,
      labelProperty: config.labelProperty,
      entityProperty: config.entityProperty,
      versionProperty: config.versionProperty,
      scope: this,
    });
  },
  insertEntry: function insertEntry(entry, options) {
    const store = this.createStore('detail');
    return store.add(entry, options);
  },
  updateEntry: function updateEntry(entry, options) {
    const store = this.createStore();

    if (!store) {
      throw new Error('No store set.');
    }

    return this.validate(entry)
      .then(function fulfilled() {
        return store.put(entry, options);
      }); // Since we left off the reject handler, it will propagate up if there is a validation error
  },
  /**
   * If an entry is valid, validate should return a promise that resolves to true. If the entry is not valid,
   * validate should return a reject promise with the error message.
   * @param entry
   * @returns Promise
   */
  validate: function validate(entry) {
    const def = new Deferred();
    if (entry) {
      def.resolve(true);
    }

    def.reject('The entry is null or undefined.');
    return def.promise;
  },
  getEntry: function getEntry(entityId, options) {
    let queryResults;
    let relatedRequests;
    const queryModelName = (options && options.queryModelName) ? options.queryModelName : 'detail';
    const store = this.createStore(queryModelName);
    const def = new Deferred();
    const includeRelated = (options && options.includeRelated) ? options.includeRelated : false;
    const queryOptions = this.getOptions(options);
    if (store) {
      relatedRequests = [];
      queryResults = store.get(entityId, queryOptions);
      when(queryResults, function(relatedFeed) { // eslint-disable-line
        const entry = queryResults.results[0];
        if (includeRelated) {
          relatedRequests = this.getRelatedRequests(entry);
        }
        if (relatedRequests.length > 0) {
          all(relatedRequests).then(
              (relatedResults) => {
                this.applyRelatedResults(entry, relatedResults);
                def.resolve(entry);
              },
              (err) => {
                def.reject(err);
              });
        } else {
          def.resolve(entry);
        }
      }.bind(this), (err) => {
        def.reject(err);
      });

      return def.promise;
    }
  },
  getEntries: function getEntries(query, options) {
    let queryResults;
    const queryModelName = (options && options.queryModelName) ? options.queryModelName : 'list';
    const def = new Deferred();
    const store = this.createStore(queryModelName);
    const queryOptions = this.getOptions(options);
    const queryExpression = this.buildQueryExpression(query, options);

    queryResults = store.query(queryExpression, queryOptions);
    if (options.returnQueryResults) {
      return queryResults;
    }
    when(queryResults, (entities) => {
      def.resolve(entities);
    }, (err) => {
      def.reject(err);
    });
    return def.promise;
  },
  getRelatedRequests: function getRelatedRequests(entry) {
    const self = this;
    const requests = [];
    this.relationships.forEach((rel) => {
      let request = null;
      if (!rel.disabled) {
        request = self.getRelatedRequest(entry, rel);
        if (request) {
          requests.push(request);
        }

        if (rel.type === 'ManyToMany') {
          const model = App.ModelManager.getModel(rel.relatedEntity, MODEL_TYPES.SDATA);
          model.getRelatedRequests(entry).forEach((req) => {
            requests.push(req);
          });
        }
      }
    });
    return requests;
  },
  getRelatedRequest: function getRelatedRequest(entry, relationship, options) {
    let model;
    let queryOptions;
    let queryResults;
    const def = new Deferred();
    model = App.ModelManager.getModel(relationship.relatedEntity, MODEL_TYPES.SDATA);
    if (model) {
      queryOptions = this.getRelatedQueryOptions(entry, relationship, options);
      if (queryOptions) {
        console.dir(relationship);
        console.dir(queryOptions);
        queryResults = model.getEntries(null, queryOptions);
        when(queryResults, (entities) => {
          const results = {
            entityName: model.entityName,
            entityDisplayName: model.entityDisplayName,
            entityDisplayNamePlural: model.entityDisplayNamePlural,
            relationship: relationship,
            count: entities.length,
            entities: entities,
          };
          def.resolve(results);
        }, (err) => {
          def.reject(err);
        });
        return def.promise;
      }
    }
  },
  getRelatedQueryOptions: function getRelatedQueryOptions(entry, relationship, options) {
    let queryOptions;
    let parentDataPath;
    let relatedDataPath;
    let relatedValue;
    let optionsTemp = options;

    if (!optionsTemp) {
      optionsTemp = {};
    }

    queryOptions = {
      count: (optionsTemp.count) ? optionsTemp.count : null,
      start: (optionsTemp.start) ? optionsTemp.start : null,
      where: (optionsTemp.where) ? optionsTemp.where : null,
      sort: (optionsTemp.orderBy) ? optionsTemp.orderBy : null,
      queryModelName: (relationship.queryModelName) ? relationship.queryModelName : 'detail',
    };

    if (relationship.parentProperty) {
      parentDataPath = (relationship.parentDataPath) ? relationship.parentDataPath : relationship.parentProperty;
      if (relationship.parentPropertyType && (relationship.parentPropertyType === 'object')) {
        parentDataPath = relationship.parentProperty + '.$key';
      }
    } else {
      parentDataPath = this.idProperty;
    }

    if (relationship.relatedProperty) {
      relatedDataPath = (relationship.relatedDataPath) ? relationship.relatedDataPath : relationship.relatedProperty;
      if (relationship.relatedPropertyType && (relationship.relatedPropertyType === 'object')) {
        relatedDataPath = relationship.relatedProperty + '.Id';
      }
    } else {
      relatedDataPath = 'Id';
    }

    relatedValue = utility.getValue(entry, parentDataPath);
    if (!relatedValue) {
      return null;
    }
    queryOptions.where = `${relatedDataPath} eq '${relatedValue}'`;
    if (relationship.where) {
      if (typeof relationship.where === 'function') {
        queryOptions.where = relationship.where.apply(this, [entry]);
      } else {
        queryOptions.where = `${queryOptions.where} and ${relationship.where}`;
      }
    }

    return queryOptions;
  },
  applyRelatedResults: function applyRelatedResults(entry, relatedResults) {
    let relatedEntities;
    relatedEntities = [];
    relatedResults.forEach((result) => {
      relatedEntities.push(result);
    });
    entry.$relatedEntities = relatedEntities;
  },
});

Manager.register('_SDataModelBase', MODEL_TYPES.SDATA, __class);
export default __class;
