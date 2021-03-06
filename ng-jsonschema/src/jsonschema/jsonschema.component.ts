import { Component, Input, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { JsonEditorComponent, JsonEditorOptions } from 'ang-jsoneditor';

import { JsonSchemaService } from '../jsonschema.service';
import { StateService } from '../state.service';

@Component({
    //  tslint:disable-next-line: component-selector
    selector: 'ng-jsonschema',
    templateUrl: './jsonschema.component.html',
    providers: [],
    styleUrls: ['./jsonschema.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class JsonSchemaComponent implements OnInit {
    public editorOptions: JsonEditorOptions;

    @ViewChild(JsonEditorComponent) editor: JsonEditorComponent; // , { static: true }

    @Input()
    schema: any = null;

    @Input()
    models: any = [];

    model: any = null;

    showSelectorModal = false;
    showAddModelForm = false;

    heading = 'Designer';


    //  restrict: 'A',
    //  scope: {
    //      $data: '=data',
    //      $mode: '@mode',
    //      $msg: '@msg',
    //      $models: '=models',
    //      readonly: '@readonly'
    //  },
    //  templateUrl: 'index-json-schema.html',

    configs: any = {
        showMoreOptn: '',
        currModelType: [],
        extraArrayOptn: '',
        menuOpen: true
    };
    modelRef: any = {
        model: 0
    };
    mode;
    data;
    entity;
    selectedEntity;
    JsonSchema = new JsonSchemaService();

    constructor(private state: StateService) {
        this.editorOptions = new JsonEditorOptions() // this.options.mode = 'code'; //set only one mode
        this.editorOptions.modes = ['code', 'text', 'tree', 'view']; // set all allowed modes
        this.state.getState().subscribe(
            res => {
                this.showSelectorModal = res.showSelectorModal;
            },
            err => {
                console.error(`An error occurred: ${err.message}`);
            }
        );
    }
    ngOnInit() {
        if (!this.model) {
            this.model = this.models[0];
        }
        if (this.model) {
            this.schema = this.model.data;
            this.data = this.JsonSchema.schema2obj(this.schema);
            this.data.root$$ = true;
            this.initRootElement();
        }
    }

    str(data) {
        return JSON.stringify(data, function (k, v) { if (v === undefined) { return null; } return v; }, '     ');
    }

    initRootElement() {
        //  initialize the root
        this.mode = this.mode ? this.mode : 'object';
        if (this.data) {
            this.entity = this.data;
            this.JsonSchema._id_ = this.getLastModelId(this.data, 0);
            return;
        }
        this.data = this.JsonSchema.newObject('##ROOT##');
        this.data.root$$ = true;

        //  initiate the entity used in all html templates;update whenever $data is changes (new opject is created)
        this.entity = this.data;
    }

    //  generates a model based on the type and key
    generateModel(type, key) {
        let newModel;
        switch (type) {
            case 'Array':
                newModel = this.JsonSchema.newArray(key);
                break;
            case 'Boolean':
                newModel = this.JsonSchema.newBoolean(key);
                break;
            case 'Integer':
                newModel = this.JsonSchema.newInteger(key);
                break;
            case 'Number':
                newModel = this.JsonSchema.newNumber(key);
                break;
            case 'Null':
                newModel = this.JsonSchema.newNull(key);
                break;
            case 'Object':
                newModel = this.JsonSchema.newObject(key);
                break;
            case 'String':
                newModel = this.JsonSchema.newString(key);
                break;
            case '$ref':
                newModel = this.JsonSchema.new$ref(key);
                break;
            case 'OneOf':
            case 'AnyOf':
            case 'AllOf':
                newModel = this.JsonSchema.newXOf(type, key);
        }
        return newModel;
    }


    // recursively fine the parent and add the entity
    addNewProp(entity, data, e, forArray) {
        console.log(entity, data, e, forArray)
        if (forArray) {
            this.addNewPropArrObj(entity, data, e);
            return;
        }
        const name = 'New Field ' + (entity._properties.length + 1);
        const apic = this.JsonSchema.newString(name);

        entity._properties.push({ [name]: apic });
        return;

        /*if (entity.__ID__ === data.__ID__) {
             let apic = JsonSchema.newString('');
             data._properties.push({"": apic});
             $timeout(function () {
                 angular.element(e.currentTarget).parents('.objCont').find('.propCont').last().find('.model-key').focus();
             });
         } else if (data._properties && data._properties.length >= 0) {
             for (let i = 0; i < data._properties.length; i++) {
                 let o = data._properties[i];
                 angular.forEach(o, function (val, key) {
                     this.addNewProp(entity, val, e);
                 });
             }
         }*/
    };

    // Add property when array type is Object
    addNewPropArrObj(entity, data, e) {
        if (!entity._items) {
            return;
        }
        const apic = this.JsonSchema.newString('');
        entity._items[0]._properties.push({ '': apic });
    };

    // callback after the model changed
    modelChangesCallback(entity) {
        this.configs.currModelType = entity._type;
        this.selectedEntity = entity;
        if (entity._type.indexOf('Array') >= 0) {
            this.configs.showMoreOptn = 'array';
            if (entity._type.indexOf('$ref') >= 0) {
                this.configs.showMoreOptn = 'Array$ref';
                this.modelRef.model = '';
            }
        } else if (entity._type.indexOf('$ref') >= 0) {
            this.configs.showMoreOptn = '$ref';
            this.modelRef.model = '';
        } else {
            this.configs.showMoreOptn = '';
        }
        this.configs.extraArrayOptn = false;
    };

    setArrayType(type, entity, e) {
        const newM = this.generateModel(type, 'arrayEle');
        entity = this.selectedEntity;
        entity._items[0] = newM;
        if (type === '$ref') {
            this.configs.extraArrayOptn = true;
            this.modelRef.model = '';
        } else {
            this.configs.extraArrayOptn = false;
        }
        e.stopPropagation();
    };

    setModelFor$Ref() {
        if (this.configs.extraArrayOptn) {
            this.selectedEntity._items[0]._value = this.modelRef.model;
            console.log(this.selectedEntity);
        } else {
            this.selectedEntity._value = this.modelRef.model;
        }
    }

    removeEntity(entity) {
        const res = this.removeModel(this.entity, entity.__ID__);
        if (res !== undefined) {
            this.data._properties.splice(res, 1);
        }
    }

    removeModel(data, id, i = null) {
        if (data.__ID__ === id) {
            return i;
        }

        let res;
        for (let j = 0; j < data._type.length; j++) {
            const type = data._type[j];
            switch (type) {
                case 'Object':
                    for (let ii = 0; ii < data._properties.length; ii++) {
                        const o = data._properties[ii];
                        for (const key in o) {
                            if (!key) {
                                continue;
                            }
                            const val = o[key];
                            res = this.removeModel(val, id, ii);
                            if (res !== undefined) {
                                data._properties.splice(ii, 1);
                            }
                        };
                    }
                    break;
                case 'Array':
                    if (data._items[0] && data._items[0]._properties) {
                        for (let ii = 0; ii < data._items[0]._properties.length; ii++) {
                            const o = data._items[0]._properties[ii];
                            for (const key in o) {
                                if (!key) {
                                    continue;
                                }
                                const val = o[key];
                                res = this.removeModel(val, id, ii);
                                if (res !== undefined) {
                                    data._items[0]._properties.splice(ii, 1);
                                }
                            };
                        }
                    }
                    break;
            }
        }

    }

    convertObj2Schema() {
        const schema = this.JsonSchema.obj2schema(this.data, this.models);
        console.log(this.data);
        this.schema = {
            json: schema,
            text: JSON.stringify(schema, null, '    '),
            dup: JSON.stringify(schema, null, '    ')
        };
        this.heading = 'JSON Schema';

    }

    convertSchema2Obj() {
        if (this.schema && this.schema.original !== this.schema.dup) {
            this.data = this.JsonSchema.schema2obj(this.schema.original, undefined, undefined, true, this.models);
        }
        this.heading = 'Designer';
    }

    // $watch(function() {
    //     return this.$data;
    // }, function() {
    //     initRootElement();
    // });

    getLastModelId(data, lastId) {
        const id = data.__ID__;
        const idNum = parseInt(id.substring(6, id.length), 10);
        if (idNum >= lastId) {
            lastId = idNum;
        }

        switch (data._type) {
            case 'Object':
                for (let i = 0; i < data._properties.length; i++) {
                    const o = data._properties[i];
                    for (const key in o) {
                        if (!key) {
                            continue;
                        }
                        const val: any = o[key];
                        if (typeof val === 'object' && val.__ID__) {
                            lastId = this.getLastModelId(val, lastId);
                        }
                    };
                }
                break;
            case 'Array':
                if (data._items[0] && data._items[0]._properties) {
                    for (let i = 0; i < data._items[0]._properties.length; i++) {
                        const o = data._items[0]._properties[i];
                        for (const key in o) {
                            if (!key) {
                                continue;
                            }
                            const val = o[key];
                            if (typeof val === 'object' && val.__ID__) {
                                lastId = this.getLastModelId(val, lastId);
                            }
                        };
                    }
                } else if (data._items[0]) {
                    lastId = this.getLastModelId(data._items[0], lastId);
                }
                break;
        }

        return lastId;
    }

    toggleSelectorModal(entity = null, e = null) {
        if (entity) {
            this.modelChangesCallback(entity);
        }
        this.state.setSelectorModel(!this.showSelectorModal);
    }

    /**
     * MODELS
     */
    editModel(index) {
        if (this.model) {
            const schema = this.JsonSchema.obj2schema(this.data, this.models);
            this.model.data = schema;
        }
        this.model = this.models[index];
        this.ngOnInit();
    }

    addModelForm() {
        this.showAddModelForm = true;
    }

    addModel() {
        this.showAddModelForm = true;
        this.models.push({
            name: 'New Model',
            schema: {}
        })
    }

    downloadJSON() {
        const filename = this.model.name + '.json';
        const text = this.str(this.model.data);
        this.download(filename, text)
    }

    download(filename, text) {
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }
}
