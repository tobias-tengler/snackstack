import React, { useRef, useEffect } from 'react';
import classNames from 'classnames';
import { Snackbar, SnackbarContent } from '@material-ui/core';
import RootRef from '@material-ui/core/RootRef';
import { snackItemVariantIcons, useSnackItemStyles } from './SnackItemStyles';
import PropTypes from 'prop-types';

const SnackItem = props => {
  const {
    offset,
    onClose,
    onExited,
    onSetSnackHeight,
    options: { autoHideDuration },
    snack: { key, message, open, variant = 'info' },
  } = props;
  const classes = useSnackItemStyles();
  const Icon = snackItemVariantIcons[variant];
  const ref = useRef();

  useEffect(() => {
    if (ref.current === undefined) return;

    onSetSnackHeight(key, ref.current.clientHeight);
  }, [key, onSetSnackHeight]);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return;

    onClose(key, event, reason);
  };

  const handleExited = event => {
    onExited(key, event);
  };

  return (
    <RootRef rootRef={ref}>
      <Snackbar
        anchorOrigin={{
          horizontal: 'left',
          vertical: 'bottom',
        }}
        autoHideDuration={autoHideDuration}
        open={open}
        style={{
          bottom: offset,
        }}
        TransitionProps={{
          direction: 'right',
        }}
        onClose={handleClose}
        onExited={handleExited}
      >
        <SnackbarContent
          aria-describedby="client-snackbar"
          className={classes[variant]}
          message={
            <span className={classes.message} id="client-snackbar">
              <Icon className={classNames(classes.icon, classes.iconVariant)} />
              {message}
            </span>
          }
        />
      </Snackbar>
    </RootRef>
  );
};

SnackItem.propTypes = {
  snack: PropTypes.shape({
    key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
    variant: PropTypes.oneOf(['error', 'warning', 'info', 'success']),
    open: PropTypes.bool.isRequired,
  }),
  options: PropTypes.shape({ autoHideDuration: PropTypes.number }),
  offset: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
  onExited: PropTypes.func.isRequired,
  onSetSnackHeight: PropTypes.func.isRequired,
};

export default SnackItem;
