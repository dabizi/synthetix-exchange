import { useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import snxJSConnector from '../utils/snxJSConnector';

import { updateLoan, LOAN_STATUS } from '../ducks/loans/myLoans';
import { fetchWalletBalances } from '../ducks/wallet';
import { fetchLoansContractInfo } from '../ducks/loans/contractInfo';
import { EtherCollateralEvents } from '../constants/contracts';

const EventHandlerGate = ({
	updateLoan,
	fetchWalletBalances,
	children,
	fetchLoansContractInfo,
}) => {
	useEffect(() => {
		if (snxJSConnector.initialized) {
			const {
				snxJS: { EtherCollateral },
			} = snxJSConnector;

			EtherCollateral.contract.on(
				EtherCollateralEvents.LOAN_CREATED,
				(_account, loanID, _amount, tx) => {
					fetchLoansContractInfo();
					fetchWalletBalances();
					updateLoan({
						transactionHash: tx.transactionHash,
						loanInfo: {
							loanID: Number(loanID),
							status: LOAN_STATUS.OPEN,
						},
						swapTransactionHashWithLoanID: true,
					});
				}
			);

			EtherCollateral.contract.on(EtherCollateralEvents.LOAN_CLOSED, (_, loanID) => {
				fetchLoansContractInfo();
				fetchWalletBalances();
				updateLoan({
					loanID: Number(loanID),
					loanInfo: {
						status: LOAN_STATUS.CLOSED,
					},
				});
			});
		}
		return () => {
			if (snxJSConnector.initialized) {
				const {
					snxJS: { EtherCollateral },
				} = snxJSConnector;

				Object.values(EtherCollateralEvents).forEach(event =>
					EtherCollateral.contract.removeAllListeners(event)
				);
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [snxJSConnector.initialized]);

	return children;
};

EventHandlerGate.propTypes = {
	updateLoan: PropTypes.func,
	fetchWalletBalances: PropTypes.func,
	fetchLoansContractInfo: PropTypes.func,
};

const mapDispatchToProps = {
	updateLoan,
	fetchWalletBalances,
	fetchLoansContractInfo,
};

export default connect(null, mapDispatchToProps)(EventHandlerGate);
