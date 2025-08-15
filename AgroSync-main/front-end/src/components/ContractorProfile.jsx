const handleCreateAgreement = async (e) => {
    e.preventDefault();
    if (!signaturePad.current || signaturePad.current.isEmpty()) {
        alert('Please sign the agreement before submitting');
        return;
    }

    const signatureData = signaturePad.current.toDataURL();
    console.log('Contractor signature data:', signatureData.substring(0, 50) + '...');

    const agreementData = {
        farmId: selectedFarm,
        farmerId: selectedFarmer,
        contractorId: user.id,
        contract_details: contractDetails,
        amount: amount,
        terms: terms,
        start_date: startDate,
        end_date: endDate,
        contractor_signature: signatureData
    };

    try {
        const response = await fetch('http://localhost:3000/agreements', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(agreementData),
        });

        const data = await response.json();

        if (data.status) {
            alert('Agreement proposed successfully!');
            setShowAgreementForm(false);
            setSelectedFarm('');
            setSelectedFarmer('');
            setContractDetails('');
            setAmount('');
            setTerms('');
            setStartDate('');
            setEndDate('');
            signaturePad.current.clear();
            fetchAgreements();
        } else {
            alert(data.message || 'Failed to create agreement');
        }
    } catch (error) {
        console.error('Error creating agreement:', error);
        alert('Error creating agreement. Please try again.');
    }
};

const handleDownloadAgreementPDF = async (agreement) => {
    try {
        console.log('Starting PDF generation for agreement:', agreement.agreementId);
        
        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
        const { width, height } = page.getSize();
        
        // Embed fonts
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
        
        // Add title
        page.drawText('Agreement Details', {
            x: 50,
            y: height - 50,
            size: 20,
            font: helveticaBold,
            color: rgb(0, 0, 0)
        });

        // Add agreement details
        const details = [
            { label: 'Agreement ID', value: agreement.agreementId },
            { label: 'Contract Details', value: agreement.contract_details },
            { label: 'Amount', value: `₹${agreement.amount}` },
            { label: 'Terms', value: agreement.terms },
            { label: 'Start Date', value: new Date(agreement.start_date).toLocaleDateString() },
            { label: 'End Date', value: new Date(agreement.end_date).toLocaleDateString() },
            { label: 'Status', value: agreement.status }
        ];

        let y = height - 100;
        details.forEach(({ label, value }) => {
            page.drawText(`${label}:`, {
                x: 50,
                y,
                size: 12,
                font: helveticaBold,
                color: rgb(0, 0, 0)
            });
            page.drawText(value.toString(), {
                x: 200,
                y,
                size: 12,
                font: helvetica,
                color: rgb(0, 0, 0)
            });
            y -= 25;
        });

        // Add signatures section
        y -= 25;
        page.drawText('Signatures:', {
            x: 50,
            y,
            size: 14,
            font: helveticaBold,
            color: rgb(0, 0, 0)
        });

        // Add contractor signature
        y -= 25;
        page.drawText('Contractor Signature:', {
            x: 50,
            y,
            size: 12,
            font: helveticaBold,
            color: rgb(0, 0, 0)
        });

        if (agreement.contractor_signature) {
            try {
                console.log('Contractor signature data:', agreement.contractor_signature.substring(0, 50) + '...');
                const contractorSignatureImage = await pdfDoc.embedPng(agreement.contractor_signature);
                page.drawImage(contractorSignatureImage, {
                    x: 50,
                    y: y - 100,
                    width: 200,
                    height: 100
                });
            } catch (error) {
                console.error('Error embedding contractor signature:', error);
                page.drawText('Signature not available', {
                    x: 50,
                    y: y - 50,
                    size: 12,
                    font: helvetica,
                    color: rgb(0.5, 0.5, 0.5)
                });
            }
        } else {
            page.drawText('Not signed', {
                x: 50,
                y: y - 50,
                size: 12,
                font: helvetica,
                color: rgb(0.5, 0.5, 0.5)
            });
        }

        // Add farmer signature
        y -= 150;
        page.drawText('Farmer Signature:', {
            x: 50,
            y,
            size: 12,
            font: helveticaBold,
            color: rgb(0, 0, 0)
        });

        if (agreement.farmer_signature) {
            try {
                console.log('Farmer signature data:', agreement.farmer_signature.substring(0, 50) + '...');
                const farmerSignatureImage = await pdfDoc.embedPng(agreement.farmer_signature);
                page.drawImage(farmerSignatureImage, {
                    x: 50,
                    y: y - 100,
                    width: 200,
                    height: 100
                });
            } catch (error) {
                console.error('Error embedding farmer signature:', error);
                page.drawText('Signature not available', {
                    x: 50,
                    y: y - 50,
                    size: 12,
                    font: helvetica,
                    color: rgb(0.5, 0.5, 0.5)
                });
            }
        } else {
            page.drawText('Not signed', {
                x: 50,
                y: y - 50,
                size: 12,
                font: helvetica,
                color: rgb(0.5, 0.5, 0.5)
            });
        }

        // Save the PDF
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        saveAs(blob, `agreement_${agreement.agreementId}.pdf`);
        
        console.log('PDF generated and downloaded successfully');
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF. Please try again.');
    }
}; 