import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Joi from 'joi-browser';
import validate from 'react-joi-validation';

import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import TimePicker from 'material-ui/TimePicker';
import Slider from 'material-ui/Slider';
import RaisedButton from 'material-ui/RaisedButton';
import moment from 'moment';

import Header from './Header';
import ErrorField from './reusable/ErrorField';
import ReusableList from './TeachersList';

import './SearchBar.css';

function restfulUrl({ day, course, start_time, end_time }) {
  const startParam = _.isDate(start_time)? `&start_time=${moment(start_time).format('HH:MM')}` : '';
  const endParam = _.isDate(end_time)? `&end_time=${moment(end_time).format('HH:MM')}`: '';
  const dayParam = _.size(day) > 0? `&day=${day}` : '';
  const courseParam = _.size(course) > 0? `course=${course}` : '';

  return `/results?${courseParam}${dayParam}${startParam}${endParam}`;
}

const schema = {
  search: Joi.object().keys({
    day: Joi.array().min(1).required().options({
      language: {
        array: {
          min: 'Please select at least one day'
        }
      }
    }),
    course: Joi.array().min(1).options({
      language: {
        array: {
          min: 'Please select at least one course'
        }
      }
    }),
    timezone: Joi.string().required().options({
      language: {
        any: {
          allowOnly: 'Please select a timezone'
        }
      }
    }),
    start_time: Joi.date().timestamp().required().options({
      language: {
        any: {
          allowOnly: 'Please select a start time'
        }
      }
    }),
    end_time: Joi.date().timestamp().required().options({
      language: {
        any: {
          allowOnly: 'Please enter an end time'
        }
      }
    })
  })
};

class SearchBar extends Component {
  constructor(props) {
    super(props);

    this.handleSubmit = this.handleSubmit.bind(this);
    this.selectionRendererCourse = this.selectionRendererCourse.bind(this);
    this.selectionRendererDay = this.selectionRendererDay.bind(this);
    this.changeHandlerCourse = this.changeHandlerCourse.bind(this);
    this.changeHandlerDay = this.changeHandlerDay.bind(this);

    this.state = {
      error: '',
      teachers: { },
      showResults: false,
    };
  }

  render() {
    const {
      days,
      courses,
      validateHandler,
      errors,
      search: {
        course,
        day,
      }

    } = this.props;

    return (
      <div className='searchBarContainer'>
        <Header currentUser={ this.props.currentUser } />

        <ErrorField error={ this.state.error } />

        <div className='searchBarOptionContainer'>
          <SelectField
            className='searchBarOption'
            hintText='Select One or More Class'
            value={ course }
            onChange={ this.changeHandlerCourse }
            onBlur={ validateHandler('course') }
            multiple
            errorText={ errors.course }
            selectionRenderer={ this.selectionRendererCourse }
          >
            { _.map(courses, ({ name, id }) => {
              return <MenuItem key={ id } insetChildren checked={ _.indexOf(course, id) > -1 } value={ id } primaryText={ <span> { name } </span> } />;
            })}
          </SelectField>

          <SelectField
            hintText='Select Day'
            value={ day }
            errorText={ errors.day }
            onChange={ this.changeHandlerDay }
            onBlur={ validateHandler('day') }
            className='searchBarOption'
            multiple
            selectionRenderer={ this.selectionRendererDay }
          >
            { _.map(days, (value, key) => <MenuItem key={ value + key } insetChildren checked={ _.indexOf(day, value) > -1 } value={ value } primaryText={ <span> { value } </span> } />) }
          </SelectField>

          <RaisedButton onClick={ this.handleSubmit } className='searchSubmitButton' label='Search' primary />
        </div>

        { this.renderTimes() }

        <div className='teacherContainer'>
          { this.renderTeachers() }
        </div>
      </div>
    );
  }

  renderTeachers() {
    const { showResults } = this.state;

    if (showResults) {
      const { teachers } = this.state;
      if (_.size(teachers) > 0) {
        return (
          <ReusableList header='Available Teachers' items={ teachers } />
        );
      } else {
        return <ErrorField error='Oops. It seems like no teacher is available. Why not try a different search?' />;
      }
    }
  }

  changeHandlerCourse(event, index, value) {
    const { changeValue } = this.props;
    changeValue('course', value);
  }

  changeHandlerDay(event, index, value) {
    const { changeValue } = this.props;
    changeValue('day', value);
  }

  selectionRendererDay(values) {
    if (_.size(values) > 1) {
      return _.trimEnd(values.join(', '), ', ');
    } else if (_.size(values) === 1) {
      return values.toString();
    }
  }

  selectionRendererCourse(values) {
    const { courses } = this.props;
    if (_.size(values) > 1) {
      const newValues = _.map(courses, ({ name, id }) => {
        if ( _.indexOf(values, id) > -1) {
          return `${name}, `;
        }
      });

      return _.trimEnd(newValues.join(''), ', ');

    } else if (_.size(values) === 1) {
      return _.map(courses, ({ name, id }) => { if (_.indexOf(values, id) > -1) { return name; } });
    }
  }

  handleSubmit() {
    const { errors } = this.props;
    if (_.size(errors) === 0) {
      this.postSearch();

      this.setState({
        showResults: true
      });
    }
  }

  postSearch() {
    const { search } = this.props;
    return fetch(restfulUrl(search), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        credentials: 'include'
      }
    }).then(response => {
      if (response.status < 400) {

        return response.json().then(({ teachers })=> {
          return this.setState({
            teachers
          });
        });
      }
    });
  }

  renderTimes() {
   return (
     <div className='sliderMin' >
       <Slider
         min={ 0 }
         max={ 24 }
         step={ 0.15 }
         defaultValue={ 0 }
       />

       <div className='sliderMax'>
         <Slider
           min={ 0 }
           max={ 24 }
           step={ 0.15 }
           defaultValue={ 24 }
         />
       </div>
     </div>
   );
  }
}

SearchBar.propTypes = {
  courses: PropTypes.array,
  errors: PropTypes.object,
  days: PropTypes.array,
  currentUser: PropTypes.shape({
    first_name: PropTypes.string,
    email: PropTypes.string,
  }),
  search: PropTypes.shape({
    start_time: PropTypes.object,
    end_time: PropTypes.object,
    day: PropTypes.array,
    course: PropTypes.array
  }),
  changeHandler: PropTypes.func.isRequired,
  validateHandler: PropTypes.func.isRequired,
  changeValue: PropTypes.func.isRequired,
};

SearchBar.defaultProps = {
  days: [],
  errors: {},
  courses: [],
  currentUser: {
    first_name: '',
    email: '',
  },
  search: {
    start_time: {},
    end_time: {},
    day: [],
    course: []
  }
};

const validationOptions = {
  joiSchema: schema,
  only: 'search',
  allowUnknown: true
};

export default validate(SearchBar, validationOptions);
