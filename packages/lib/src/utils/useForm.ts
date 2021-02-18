import { useEffect, useMemo, useState } from 'preact/hooks';
import Validator, { ValidatorRules } from './Validator/Validator';

function useForm<DataState = { [key: string]: any }>(props: { rules?: ValidatorRules; [key: string]: any }) {
    const { rules = {}, formatters = {}, defaultData = {} } = props;
    const validator = new Validator(rules);
    const [schema, setSchema] = useState<string[]>(props.schema ?? []);

    /**
     * Format and validate a field
     */
    const processField = (key, value, mode) => {
        const formattedValue = formatters[key] ? formatters[key](value ?? '') : value;
        const validationResult = validator.validate(key, formattedValue, mode);
        return [formattedValue, validationResult];
    };

    /**
     * Processes default data and sets as default in state
     */

    const defaultState = useMemo<any>(() => {
        return schema.reduce(
            (acc: any, fieldKey) => {
                if (typeof defaultData[fieldKey] !== 'undefined') {
                    const [formattedValue, validationResult] = processField(fieldKey, defaultData[fieldKey], 'blur');
                    return {
                        valid: { ...acc.valid, [fieldKey]: validationResult.isValid ?? false },
                        errors: { ...acc.errors, [fieldKey]: validationResult.hasError() ? validationResult.getError() : false },
                        data: { ...acc.data, [fieldKey]: formattedValue }
                    };
                }

                // If no default value is set, set field to the default initial values
                return {
                    valid: { ...acc.valid, [fieldKey]: false },
                    errors: { ...acc.errors, [fieldKey]: null },
                    data: { ...acc.data, [fieldKey]: null }
                };
            },
            { data: {}, valid: {}, errors: {} }
        );
    }, [schema]);

    const [errors, setErrors] = useState<any>(defaultState.errors);
    const [valid, setValid] = useState<any>(defaultState.valid);
    const [data, setData] = useState<DataState>(defaultState.data as DataState);
    const isValid = useMemo(() => schema.reduce((acc, val) => acc && valid[val], true), [valid]);

    const updateFieldData = (key, value) => {
        setData(prevData => ({ ...prevData, [key]: value }));
    };

    const updateFieldValidation = (key, validation) => {
        setValid(prevValid => ({ ...prevValid, [key]: validation.isValid ?? false }));
        setErrors(prevErrors => ({ ...prevErrors, [key]: validation.hasError() ? validation.getError() : false }));
    };

    const reindexSchema = keys => {
        const cleanupRemovedFields = (prevData, initialValue, defaultStateValues) => {
            return keys.reduce((acc, key) => {
                const fallbackValue = defaultStateValues[key] !== undefined ? defaultStateValues[key] : initialValue;
                acc[key] = prevData[key] !== undefined ? prevData[key] : fallbackValue;
                return acc;
            }, {});
        };

        setData(prevData => cleanupRemovedFields(prevData, null, defaultState.data));
        setErrors(prevData => cleanupRemovedFields(prevData, null, defaultState.errors));
        setValid(prevData => cleanupRemovedFields(prevData, false, defaultState.valid));
    };

    const getTargetValue = (key, e) => {
        if (!e.target) return e;

        if (e.target.type === 'checkbox') {
            return !data[key];
        }
        return e.target.value;
    };

    const handleChangeFor = (key, mode = 'blur') => e => {
        const value = e?.target ? getTargetValue(key, e) : e;
        const [formattedValue, validationResult] = processField(key, value, mode);

        updateFieldData(key, formattedValue);
        updateFieldValidation(key, validationResult);
    };

    const triggerValidation = () => {
        schema.forEach(key => {
            const [, validationResult] = processField(key, data[key], 'blur');
            updateFieldValidation(key, validationResult);
        });
    };

    // Rebuild from schema
    useEffect(() => {
        reindexSchema(schema);
    }, [schema]);

    return {
        handleChangeFor,
        triggerValidation,
        setSchema,
        setData,
        setValid,
        setErrors,
        isValid,
        errors,
        valid,
        schema,
        data
    };
}

export default useForm;
