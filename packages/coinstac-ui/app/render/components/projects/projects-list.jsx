import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { connect } from 'react-redux';
import app from 'ampersand-app';
import deepEqual from 'deep-equal';
import {
  fetch as fetchProjects,
  remove as removeProject,
  setProjects,
} from '../../state/ducks/projects';
import ProjectCard from './project-card';
import hilarious from '../../utils/hilarious-loading-messages';
import { runComputation } from '../../state/ducks/bg-services';

class ProjectsList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ready: false,
    };
  }

  componentWillMount() {
    this.props.fetchProjects((err) => {
      if (err) {
        app.logger.error(err);
        app.notify({
          level: 'error',
          message: `Failed to load projects: ${err.message}`,
        });
      } else {
        this.setState({ ready: true });
      }
    });
  }

  componentWillUnmount() {
    this.props.setProjects(null);
  }

  delete(project) {
    this.props.removeProject(project);
  }

  /**
   * Run a computation.
   *
   * @param {Object} project
   * @param {string} project._id
   * @param {string} project.consortiumId
   */
  runComputation({ _id: projectId, consortiumId }) {
    this.context.router.push('/');

    this.props.runComputation({ consortiumId, projectId })
      .catch((err) => {
        app.notify({
          level: 'error',
          message: err.message,
        });
      });
  }

  render() {
    const { consortia, projects, username } = this.props;

    if (!this.state.ready) {
      return (<span>{hilarious.random()}</span>);
    }

    return (
      <div>
        <div className="page-header clearfix">
          <h1 className="pull-left">My Files</h1>
          <LinkContainer className="pull-right" to="/dashboard/my-files/new">
            <Button bsStyle="primary" className="pull-right">
              <span aria-hidden="true" className="glphicon glyphicon-plus" />
              {' '}
              Add Files Collection
            </Button>
          </LinkContainer>
        </div>
        <div className="projects-list">
          {projects.map((project) => {
            const consortium = consortia.find((c) => {
              return c._id === project.consortiumId;
            });

            let consortiumName = '';
            let showComputationRunButton = false;
            let isInvalidMapping = false;

            if (consortium) {
              consortiumName = consortium.label;
              showComputationRunButton =
                consortium.owners.indexOf(username) > -1;
              isInvalidMapping = !deepEqual(
                consortium.activeComputationInputs,
                project.computationInputs
              );
            }

            return (
              <ProjectCard
                allowComputationRun={project.allowComputationRun}
                computationStatus={project.status}
                consortiumName={consortiumName}
                id={project._id}
                isInvalidMapping={isInvalidMapping}
                key={`project-card-${project._id}`}
                name={project.name}
                removeProject={() => this.delete(project)}
                runComputation={() => this.runComputation(project)}
                showComputationRunButton={showComputationRunButton}
              />
            );
          })}
        </div>
      </div>
    );
  }
}

ProjectsList.contextTypes = {
  router: PropTypes.shape({
    push: PropTypes.func.isRequired,
  }).isRequired,
};

ProjectsList.propTypes = {
  consortia: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    activeComputationInputs: PropTypes.array.isRequired,
    owners: PropTypes.arrayOf(PropTypes.string).isRequired,
  })).isRequired,
  fetchProjects: PropTypes.func.isRequired,
  projects: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string,
    allowComputationRun: PropTypes.bool.isRequired,
    computationInputs: PropTypes.array.isRequired,
    consortiumId: PropTypes.string,
    files: PropTypes.array,
    name: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
  })),
  removeProject: PropTypes.func.isRequired,
  runComputation: PropTypes.func.isRequired,
  setProjects: PropTypes.func.isRequired,
  username: PropTypes.string,
};


ProjectsList.defaultProps = {
  projects: null,
  username: '',
};

function mapStateToProps({
  consortia: { allConsortia },
  projects: { allProjects },
  auth,
}) {
  return {
    projects: allProjects,
    consortia: allConsortia,
    username: auth.user.username,
  };
}

export default connect(mapStateToProps, {
  fetchProjects,
  removeProject,
  runComputation,
  setProjects,
})(ProjectsList);